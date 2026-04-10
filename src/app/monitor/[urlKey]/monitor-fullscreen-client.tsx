"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Minimize, Maximize, ArrowLeft } from "lucide-react"
import { BedMonitorCard } from "@/components/monitoring/bed-monitor-card"
import type { MonitorRealtime } from "@/types/monitor"
import { useRouter } from "next/navigation"
import { useSSE } from "@/hooks/use-sse"

// ── Constants ─────────────────────────────────────────────────────────────────
const bedGridStyle = { gridTemplateColumns: `repeat(auto-fill, minmax(560px, 1fr))` }

// ── Fullscreen Monitor Client ─────────────────────────────────────────────────
export function MonitorFullscreenClient({ urlKey }: { urlKey: string }) {
  const router = useRouter()
  const [realtimeData, setRealtimeData] = useState<MonitorRealtime | null>(null)

  const { connected, error } = useSSE<MonitorRealtime>({
    path: `/sse/monitor/url/${urlKey}`,
    onSnapshot: (data) => {
      // 각 bed에 1500 samples (6초 @ 250Hz) baseline 값으로 ECG 초기화 → 첫 로드 시 일자 파형 표시
      const initialized: MonitorRealtime = {
        ...data,
        beds: data.beds.map((bed) => ({
          ...bed,
          ecg: {
            samples: new Array(1500).fill(512),
            sample_rate_hz: 250,
            measured_at: new Date().toISOString(),
            total_received: 1500,
          },
        })),
      }
      setRealtimeData(initialized)
    },
    onVitals: (update) => {
      console.log("[SSE vitals]", update)
      setRealtimeData((prev) => {
        if (!prev) return prev
        const bedIds = prev.beds.map(b => b.bed_id)
        const targetBed = prev.beds.find(b => b.bed_id === update.bed_id)
        console.log("[SSE vitals] bedIds:", bedIds, "target:", update.bed_id, "found:", !!targetBed)
        const newBeds = prev.beds.map((bed) => {
          if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
          const vitals = { ...(bed.vitals ?? {}) } as Record<string, unknown>
          const t = update.type as string
          if (t === "HR") vitals.hr = update.value
          else if (t === "SPO2") vitals.spo2 = update.value
          else if (t === "RR") vitals.rr = update.value
          else if (t === "TEMP") vitals.temp = update.value
          else if (t === "BP") {
            vitals.bp_systolic = update.value
            vitals.bp_diastolic = update.extra_value
            const s = update.value as number, d = update.extra_value as number
            vitals.bp_mean = s && d ? Math.round((s + 2 * d) / 3 * 10) / 10 : null
          }
          console.log("[SSE vitals] updated bed:", bed.bed_id, "new vitals:", vitals)
          return { ...bed, vitals: vitals as unknown as typeof bed.vitals }
        })
        return { ...prev, beds: newBeds }
      })
    },
    onAlarm: (update) => {
      setRealtimeData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          beds: prev.beds.map((bed) =>
            bed.bed_id && update.bed_id === bed.bed_id
              ? { ...bed, alarm_message: update.message as string }
              : bed
          ),
        }
      })
    },
    onEcg: (update) => {
      setRealtimeData((prev) => {
        if (!prev) return prev
        const newSamples = update.samples as number[]
        const sampleRate = update.sample_rate_hz as number
        const maxSamples = sampleRate * 6 // 6초 rolling window
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
            const existing = bed.ecg?.samples ?? []
            const merged = [...existing, ...newSamples].slice(-maxSamples)
            const totalReceived = (bed.ecg?.total_received ?? 0) + newSamples.length
            return {
              ...bed,
              ecg: {
                samples: merged,
                sample_rate_hz: sampleRate,
                measured_at: update.measured_at as string,
                total_received: totalReceived,
              },
            }
          }),
        }
      })
    },
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleChange)
    return () => document.removeEventListener("fullscreenchange", handleChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // ── Drag-to-scroll ──
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const scrollLeftRef = useRef(0)
  const scrollTopRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    scrollLeftRef.current = el.scrollLeft
    scrollTopRef.current = el.scrollTop
    el.style.cursor = "grabbing"
    el.style.userSelect = "none"
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    scrollRef.current.scrollLeft = scrollLeftRef.current - dx
    scrollRef.current.scrollTop = scrollTopRef.current - dy
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab"
      scrollRef.current.style.userSelect = ""
    }
  }, [])

  if (!realtimeData && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050510]">
        <p className="text-[#808099]">Loading monitor...</p>
      </div>
    )
  }

  if (!realtimeData && error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050510] gap-4">
        <p className="text-[#f87171]">{error}</p>
        <button
          onClick={() => router.push("/select")}
          className="px-4 py-2 rounded-md bg-[#1e1f35] text-[#808099] hover:text-white hover:bg-[#2a2b45] transition-colors text-sm"
        >
          Back to Select
        </button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("h-screen overflow-auto bg-[#050510] p-4 flex flex-col")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/select")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[#808099] hover:text-white hover:bg-[#1e1f35] transition-colors text-xs"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-white">
              {realtimeData?.monitor_name ?? "Monitor"}
            </h1>
            <p className="text-xs text-[#808099]">
              {realtimeData?.beds.filter((b) => b.encounter_id).length ?? 0} beds connected
              {!connected && error && (
                <span className="ml-2 text-[#f59e0b]">{error}</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e1f35] text-[#808099] hover:text-white hover:bg-[#2a2b45] transition-colors text-xs"
        >
          {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
          {isFullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>

      {/* Bed Grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto cursor-grab [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="grid gap-4"
          style={bedGridStyle}
        >
          {realtimeData?.beds.map((bed) => (
            <BedMonitorCard key={bed.position} bed={bed} />
          ))}
        </div>
      </div>
    </div>
  )
}

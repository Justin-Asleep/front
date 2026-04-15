"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Minimize, Maximize, ArrowLeft } from "lucide-react"
import { BedMonitorCard } from "@/components/monitoring/bed-monitor-card"
import type { MonitorRealtime } from "@/types/monitor"
import { useRouter } from "next/navigation"
import { useBedRealtimeSSE } from "@/hooks/use-bed-realtime-sse"
import { useAlarmSound } from "@/hooks/use-alarm-sound"

// ── Constants ─────────────────────────────────────────────────────────────────
const bedGridStyle = { gridTemplateColumns: `repeat(auto-fill, minmax(560px, 1fr))` }

// ── Fullscreen Monitor Client ─────────────────────────────────────────────────
export function MonitorFullscreenClient({ urlKey }: { urlKey: string }) {
  const router = useRouter()
  const { data: realtimeData, connected, error } = useBedRealtimeSSE<MonitorRealtime>(
    `/sse/monitor/url/${urlKey}`
  )
  const { ackBed, isBedAcked } = useAlarmSound(realtimeData?.beds)

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
            <BedMonitorCard
              key={bed.position}
              bed={bed}
              isAcked={isBedAcked(bed)}
              onAck={ackBed}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

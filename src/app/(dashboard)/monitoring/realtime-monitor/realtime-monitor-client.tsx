"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Maximize, Minimize } from "lucide-react"
import { apiGet } from "@/services/api"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { BedMonitorCard } from "@/components/monitoring/bed-monitor-card"
import type { MonitorListItem, MonitorRealtime, PaginatedData } from "@/types/monitor"

// ── Client Component ───────────────────────────────────────────────────────────
export function RealtimeMonitorClient() {
  const [monitors, setMonitors] = useState<MonitorListItem[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [realtimeData, setRealtimeData] = useState<MonitorRealtime | null>(null)
  const [loading, setLoading] = useState(true)

  // Load monitor list
  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<PaginatedData<MonitorListItem>>("/proxy/monitors?page=1&size=100")
        setMonitors(data.items)
        if (data.items.length > 0) setSelectedId(data.items[0].id)
      } catch (err) {
        console.error("Failed to load monitors:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load realtime data when monitor selected
  const fetchRealtime = useCallback(async (monitorId: string) => {
    if (!monitorId) return
    try {
      const data = await apiGet<MonitorRealtime>(`/proxy/monitors/${monitorId}/realtime`)
      setRealtimeData(data)
    } catch (err) {
      console.error("Failed to load realtime data:", err)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchRealtime(selectedId)
  }, [selectedId, fetchRealtime])

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

  const monitorOptions = useMemo(() => monitors.map((m) => ({ value: m.id, label: m.name })), [monitors])
  const connectedBeds = realtimeData?.beds.filter((b) => b.encounter_id).length ?? 0


  // ── Drag-to-scroll ──
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const scrollLeft = useRef(0)
  const scrollTop = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    isDragging.current = true
    startX.current = e.clientX
    startY.current = e.clientY
    scrollLeft.current = el.scrollLeft
    scrollTop.current = el.scrollTop
    el.style.cursor = "grabbing"
    el.style.userSelect = "none"
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    scrollRef.current.scrollLeft = scrollLeft.current - dx
    scrollRef.current.scrollTop = scrollTop.current - dy
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab"
      scrollRef.current.style.userSelect = ""
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading monitors...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("-m-6 p-6 min-h-full bg-[#050510]", isFullscreen && "h-screen overflow-auto")}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-white">Realtime Monitor</h1>
        <p className="text-sm text-[#808099]">
          {realtimeData?.monitor_name ?? "Select a monitor"} - {connectedBeds} beds connected
        </p>
      </div>

      {/* Monitor selector */}
      <div className="flex items-center gap-3 mb-4">
        <SearchableSelect
          value={selectedId}
          onValueChange={setSelectedId}
          options={monitorOptions}
          placeholder="Select monitor..."
          className="h-9 w-[240px] border-[#2a2b45] bg-[#0a0b1a] text-[13px] text-white"
          portalContainer={isFullscreen ? containerRef : undefined}
        />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs text-[#16a34a]">{connectedBeds} beds connected</span>
        </div>
      </div>

      {/* Bed Grid — drag-to-scroll when viewport < min content width */}
      {realtimeData ? (
        <div
          ref={scrollRef}
          className="overflow-auto cursor-grab [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(560px, 1fr))`,
            }}
          >
            {realtimeData.beds.map((bed) => (
              <BedMonitorCard key={bed.position} bed={bed} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[#808099]">Select a monitor to view realtime data</div>
      )}

      {/* Fullscreen toggle */}
      <div className="flex justify-end mt-4">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e1f35] text-[#808099] hover:text-white hover:bg-[#2a2b45] transition-colors text-xs"
        >
          {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  )
}

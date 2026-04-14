"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Minimize, Maximize, ArrowLeft } from "lucide-react"
import { BedMonitorCard } from "@/components/monitoring/bed-monitor-card"
import type { StationRealtime } from "@/types/monitor"
import { useRouter } from "next/navigation"
import { useBedRealtimeSSE } from "@/hooks/use-bed-realtime-sse"

// ── Constants ─────────────────────────────────────────────────────────────────
const CARD_MIN_WIDTH = 560
const CARD_HEIGHT = 196 // 180px min-h + 16px gap
const GRID_GAP = 16
const HEADER_HEIGHT = 72
const PADDING = 32 // p-4 top + bottom
const bedGridStyle = { gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_MIN_WIDTH}px, 1fr))` }

function calcBedsPerPage(width: number, height: number): number {
  const cols = Math.max(1, Math.floor((width - PADDING) / (CARD_MIN_WIDTH + GRID_GAP)))
  const rows = Math.max(1, Math.floor((height - HEADER_HEIGHT - PADDING) / CARD_HEIGHT))
  return cols * rows
}

// ── Fullscreen Station Client ────────────────────────────────────────────────
export function StationFullscreenClient({ urlKey }: { urlKey: string }) {
  const router = useRouter()
  const { data: realtimeData, connected, error } = useBedRealtimeSSE<StationRealtime>(
    `/sse/station/url/${urlKey}`
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [bedsPerPage, setBedsPerPage] = useState(12)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const update = () => setBedsPerPage(calcBedsPerPage(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

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

  // ── Pagination ──
  const totalBeds = realtimeData?.beds.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalBeds / bedsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])
  const paginatedBeds = useMemo(() => {
    if (!realtimeData) return []
    const start = (currentPage - 1) * bedsPerPage
    return realtimeData.beds.slice(start, start + bedsPerPage)
  }, [realtimeData, currentPage, bedsPerPage])

  if (!realtimeData && !error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050510]">
        <p className="text-[#808099]">Loading station...</p>
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
      className={cn("h-screen overflow-hidden bg-[#050510] p-4 flex flex-col")}
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
              {realtimeData?.station_name ?? "Station"}
            </h1>
            <p className="text-xs text-[#808099]">
              {realtimeData?.ward_name} &middot; {totalBeds} beds
              {!connected && error && (
                <span className="ml-2 text-[#f59e0b]">{error}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "size-8 rounded-md text-sm font-medium transition-colors",
                    page === currentPage
                      ? "bg-[#2563eb] text-white"
                      : "bg-[#1e1f35] text-[#808099] hover:text-white hover:bg-[#2a2b45]"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e1f35] text-[#808099] hover:text-white hover:bg-[#2a2b45] transition-colors text-xs"
          >
            {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid gap-4" style={bedGridStyle}>
          {paginatedBeds.map((bed) => (
            <BedMonitorCard key={bed.position} bed={bed} />
          ))}
        </div>
      </div>
    </div>
  )
}

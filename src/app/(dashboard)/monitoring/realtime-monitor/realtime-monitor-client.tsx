"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { apiGet } from "@/services/api"
import { SearchableSelect } from "@/components/ui/searchable-select"

// ── Types ──────────────────────────────────────────────────────────────────────
interface MonitorListItem {
  id: string
  name: string
  layout: string
  is_active: boolean
}

interface PaginatedData<T> {
  items: T[]
  total: number
}

interface VitalRange {
  high: number | null
  low: number | null
}

interface RealtimeBedVitals {
  hr: number | null
  hr_range: VitalRange | null
  spo2: number | null
  spo2_range: VitalRange | null
  rr: number | null
  rr_range: VitalRange | null
  temp: number | null
  temp_range: VitalRange | null
  bp_systolic: number | null
  bp_diastolic: number | null
  bp_mean: number | null
  pvc: number | null
  ews: number | null
}

interface RealtimeBed {
  position: number
  bed_id: string | null
  bed_label: string | null
  patient_name: string | null
  encounter_id: string | null
  vitals: RealtimeBedVitals | null
}

interface MonitorRealtime {
  monitor_id: string
  monitor_name: string
  layout: string
  beds: RealtimeBed[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getGridCols(layout: string): number {
  const cols = parseInt(layout.split("x")[0], 10)
  return cols || 2
}

function formatRange(range: VitalRange | null | undefined): string | null {
  if (!range || (range.high == null && range.low == null)) return null
  return `${range.high ?? "--"}/${range.low ?? "--"}`
}

function getEwsColor(ews: number): string {
  if (ews <= 4) return "bg-[#16a34a]"
  if (ews <= 6) return "bg-[#eab308]"
  return "bg-[#dc2626]"
}

// ── ECG Waveform ──────────────────────────────────────────────────────────────
function EcgWaveform({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 476 60" className={cn("w-full", className)} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.5"
        points="0,30 40,30 50,30 55,28 60,30 70,30 75,30 80,10 85,50 90,5 95,55 100,30 110,30 150,30 160,30 165,28 170,30 180,30 185,30 190,10 195,50 200,5 205,55 210,30 220,30 260,30 270,30 275,28 280,30 290,30 295,30 300,10 305,50 310,5 315,55 320,30 330,30 370,30 380,30 385,28 390,30 400,30 405,30 410,10 415,50 420,5 425,55 430,30 440,30 476,30"
      />
    </svg>
  )
}

// ── Bed Monitor Card ──────────────────────────────────────────────────────────
function BedMonitorCard({ bed }: { bed: RealtimeBed }) {
  if (!bed.encounter_id) {
    return (
      <div className="rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] border border-dashed border-[#2a2b45] flex flex-col items-center justify-center min-h-[220px] gap-2">
        <div className="w-10 h-10 rounded-full border border-dashed border-[#3b3b5c] flex items-center justify-center">
          <span className="text-[18px] text-[#3b3b5c]">—</span>
        </div>
        <p className="text-[13px] font-semibold text-[#4a4a6a]">{bed.bed_label ?? `Position ${bed.position}`}</p>
        <p className="text-[11px] text-[#3b3b5c]">Empty Bed</p>
      </div>
    )
  }

  const v = bed.vitals

  return (
    <div className="rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] overflow-hidden flex flex-col min-h-[220px]">
      {/* ── Top Section: Info + ECG ── */}
      <div className="flex min-h-[140px]">
        {/* Left Column: Patient Info + HR */}
        <div className="flex flex-col w-[200px] shrink-0 border-r border-[#1e1f35] p-3">
          {/* Monitoring header */}
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#808099]">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] font-semibold text-[#808099] tracking-wide uppercase">Monitoring</span>
          </div>
          {/* Patient info */}
          <p className="text-[13px] font-bold text-[#b2b2cc] leading-tight">{bed.bed_label}</p>
          <p className="text-[12px] text-[#808099] mb-3">{bed.patient_name}</p>

          {/* HR - large display */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-[11px] font-semibold text-[#22c55e]">HR</span>
              <span className="text-[9px] text-[#808099]">(bpm)</span>
              {v?.hr_range && (
                <span className="text-[9px] text-[#555] ml-auto font-mono">
                  {v.hr_range.high ?? "--"}<br/>{v.hr_range.low ?? "--"}
                </span>
              )}
            </div>
            <p className="text-[40px] font-bold leading-none text-[#22c55e] tracking-tight">
              {v?.hr != null ? Math.round(v.hr) : "--"}
            </p>
          </div>
        </div>

        {/* Center: ECG Waveform */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-[10px] font-semibold text-[#4ade80]">ECG</span>
            <div className="flex items-center gap-2">
              {/* EWS Badge */}
              {v?.ews != null && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#808099] font-semibold">EWS</span>
                  <span className={cn(
                    "text-[13px] font-bold text-white px-1.5 py-0.5 rounded",
                    getEwsColor(v.ews)
                  )}>
                    {v.ews}
                  </span>
                </div>
              )}
              {/* Status indicators */}
              <div className="flex items-center gap-0.5">
                <span className="w-3 h-5 rounded-sm bg-[#22c55e]" />
                <span className="w-3 h-5 rounded-sm bg-[#eab308]" />
                <span className="w-3 h-5 rounded-sm bg-[#dc2626]" />
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center px-2">
            <EcgWaveform className="h-[70px]" />
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Vital Signs Row ── */}
      <div className="flex border-t border-[#1e1f35]">
        {/* PVC */}
        <div className="flex-1 border-r border-[#1e1f35] px-2 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold text-white">PVC</span>
            <span className="text-[8px] text-[#555]">(/min)</span>
          </div>
          <p className="text-[22px] font-bold leading-none text-white mt-1">
            {v?.pvc != null ? v.pvc : "--"}
          </p>
        </div>

        {/* RESP */}
        <div className="flex-1 border-r border-[#1e1f35] px-2 py-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-semibold text-[#fbbf24]">RESP</span>
              <span className="text-[8px] text-[#555]">(/min)</span>
            </div>
            {v?.rr_range && (
              <span className="text-[8px] text-[#555] font-mono leading-tight text-right">
                {v.rr_range.high ?? "--"}<br/>{v.rr_range.low ?? "--"}
              </span>
            )}
          </div>
          <p className="text-[22px] font-bold leading-none text-[#fbbf24] mt-1">
            {v?.rr != null ? Math.round(v.rr) : "--"}
          </p>
        </div>

        {/* SpO2 */}
        <div className="flex-1 border-r border-[#1e1f35] px-2 py-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-semibold text-[#38bdf8]">SpO2</span>
              <span className="text-[8px] text-[#555]">(%)</span>
            </div>
            {v?.spo2_range && (
              <span className="text-[8px] text-[#555] font-mono leading-tight text-right">
                {v.spo2_range.high ?? "--"}<br/>{v.spo2_range.low ?? "--"}
              </span>
            )}
          </div>
          <p className="text-[22px] font-bold leading-none text-[#38bdf8] mt-1">
            {v?.spo2 != null ? Math.round(v.spo2) : "--"}
          </p>
        </div>

        {/* Temp */}
        <div className="flex-1 border-r border-[#1e1f35] px-2 py-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-semibold text-[#a78bfb]">Temp</span>
              <span className="text-[8px] text-[#555]">(°C)</span>
            </div>
            {v?.temp_range && (
              <span className="text-[8px] text-[#555] font-mono leading-tight text-right">
                {v.temp_range.high != null ? v.temp_range.high.toFixed(1) : "--"}<br/>
                {v.temp_range.low != null ? v.temp_range.low.toFixed(1) : "--"}
              </span>
            )}
          </div>
          <p className="text-[22px] font-bold leading-none text-[#a78bfb] mt-1">
            {v?.temp != null ? v.temp.toFixed(1) : "--"}
          </p>
        </div>

        {/* NBP */}
        <div className="flex-1 px-2 py-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold text-[#f87171]">NBP</span>
            <span className="text-[8px] text-[#555]">mmHg</span>
          </div>
          <p className="text-[20px] font-bold leading-none text-[#f87171] mt-1">
            {v?.bp_systolic != null
              ? `${Math.round(v.bp_systolic)}/${Math.round(v.bp_diastolic ?? 0)}`
              : "--"}
          </p>
          {v?.bp_mean != null && (
            <p className="text-[11px] text-[#f87171]/70 font-semibold">
              ({Math.round(v.bp_mean)})
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

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

  const monitorOptions = monitors.map((m) => ({ value: m.id, label: m.name }))
  const connectedBeds = realtimeData?.beds.filter((b) => b.encounter_id).length ?? 0
  const gridCols = realtimeData ? getGridCols(realtimeData.layout) : 2

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading monitors...</p>
      </div>
    )
  }

  return (
    <div className="-m-6 p-6 min-h-full bg-[#050510]">
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
        />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs text-[#16a34a]">{connectedBeds} beds connected</span>
        </div>
      </div>

      {/* Bed Grid */}
      {realtimeData ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {realtimeData.beds.map((bed) => (
            <BedMonitorCard key={bed.position} bed={bed} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#808099]">Select a monitor to view realtime data</div>
      )}
    </div>
  )
}

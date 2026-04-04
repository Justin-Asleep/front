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

interface RealtimeBedVitals {
  hr: number | null
  spo2: number | null
  rr: number | null
  temp: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
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

// ── Constants ──────────────────────────────────────────────────────────────────
const VITAL_DEFS = [
  { key: "hr", label: "HR", unit: "bpm", color: "text-[#22c55e]" },
  { key: "spo2", label: "SpO2", unit: "%", color: "text-[#38bdf8]" },
  { key: "rr", label: "RR", unit: "/min", color: "text-[#fbbf24]" },
  { key: "temp", label: "Temp", unit: "°C", color: "text-[#a78bfb]" },
  { key: "bp", label: "BP", unit: "mmHg", color: "text-[#f87171]" },
] as const

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatVital(vitals: RealtimeBedVitals | null, key: string): string {
  if (!vitals) return "--"
  if (key === "hr") return vitals.hr != null ? String(Math.round(vitals.hr)) : "--"
  if (key === "spo2") return vitals.spo2 != null ? String(Math.round(vitals.spo2)) : "--"
  if (key === "rr") return vitals.rr != null ? String(Math.round(vitals.rr)) : "--"
  if (key === "temp") return vitals.temp != null ? vitals.temp.toFixed(1) : "--"
  if (key === "bp") return vitals.bp_systolic != null ? `${Math.round(vitals.bp_systolic)}/${Math.round(vitals.bp_diastolic ?? 0)}` : "--"
  return "--"
}

function getGridCols(layout: string): number {
  const cols = parseInt(layout.split("x")[0], 10)
  return cols || 2
}

// ── ECG Waveform ──────────────────────────────────────────────────────────────
function EcgWaveform() {
  return (
    <div className="bg-[#111221] rounded-lg p-3 mt-auto">
      <p className="text-[#4ade80] text-[10px] font-semibold mb-1">ECG</p>
      <svg viewBox="0 0 476 60" className="w-full h-[60px]" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.5"
          points="0,30 40,30 50,30 55,28 60,30 70,30 75,30 80,10 85,50 90,5 95,55 100,30 110,30 150,30 160,30 165,28 170,30 180,30 185,30 190,10 195,50 200,5 205,55 210,30 220,30 260,30 270,30 275,28 280,30 290,30 295,30 300,10 305,50 310,5 315,55 320,30 330,30 370,30 380,30 385,28 390,30 400,30 405,30 410,10 415,50 420,5 425,55 430,30 440,30 476,30"
        />
      </svg>
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
    <div className="-m-6 p-6 min-h-full bg-[#f9fafb]">
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Realtime Monitor</h1>
        <p className="text-sm text-[#4b5563]">
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
          className="h-9 w-[240px] border-[#d1d5db] text-[13px]"
        />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs text-[#16a34a]">{connectedBeds} beds connected</span>
        </div>
      </div>

      {/* Bed Grid */}
      {realtimeData ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {realtimeData.beds.map((bed) => (
            <div
              key={bed.position}
              className={cn(
                "rounded-xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] p-4 flex flex-col min-h-[320px]",
                bed.encounter_id ? "bg-[#1a1b2e]" : "bg-[#13142a] border border-dashed border-[#2a2b45]"
              )}
            >
              {bed.encounter_id ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-semibold text-[#b2b2cc]">{bed.bed_label}</p>
                  </div>
                  <p className="text-base font-bold text-white mb-4">{bed.patient_name}</p>

                  {/* Vitals */}
                  <div className="flex items-start gap-6 mb-4">
                    {VITAL_DEFS.map((v) => (
                      <div key={v.key}>
                        <p className="text-[10px] font-semibold text-[#808099] mb-1">{v.label}</p>
                        <p className={cn("text-[28px] font-bold leading-none", v.color)}>
                          {formatVital(bed.vitals, v.key)}
                        </p>
                        <p className="text-[10px] text-[#808099] mt-1">{v.unit}</p>
                      </div>
                    ))}
                  </div>

                  {/* ECG */}
                  <EcgWaveform />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-10 h-10 rounded-full border border-dashed border-[#3b3b5c] flex items-center justify-center">
                    <span className="text-[18px] text-[#3b3b5c]">—</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#4a4a6a]">{bed.bed_label ?? `Position ${bed.position}`}</p>
                  <p className="text-[11px] text-[#3b3b5c]">Empty Bed</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#9ca3af]">Select a monitor to view realtime data</div>
      )}
    </div>
  )
}

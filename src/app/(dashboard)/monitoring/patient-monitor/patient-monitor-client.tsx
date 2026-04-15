"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { apiGet } from "@/services/api"
import { toLocalDate, toLocalGroupKey, toLocalHourMinute } from "@/helpers/format-date"

// ── Types ──────────────────────────────────────────────────────────────────────
interface VitalsDTO {
  hr: number | null
  spo2: number | null
  rr: number | null
  temp: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  measured_at: string | null
}

interface ObservationItem {
  type: string
  value: number | null
  extra_value: number | null
  measured_at: string
}

interface BedMonitorData {
  patient_id: string
  patient_name: string
  patient_mrn: string
  patient_gender: string | null
  encounter_id: string
  admitted_at: string
  bed_label: string
  room_name: string
  ward_name: string
  vitals: VitalsDTO
  observations: ObservationItem[]
  latest_alarm: string | null
}

// ── Threshold Types ───────────────────────────────────────────────────────────
interface ThresholdDTO {
  param_type: string
  critical_low: number | null
  warning_low: number | null
  warning_high: number | null
  critical_high: number | null
}

interface VitalCard {
  key: string
  label: string
  unit: string
  normal: string
  color: string
  min: number
  max: number
}

const VITAL_CARD_META: Record<string, { label: string; unit: string; color: string }> = {
  HR:     { label: "Heart Rate",     unit: "bpm",  color: "var(--vital-hr)" },
  SPO2:   { label: "SpO2",           unit: "%",    color: "var(--vital-spo2)" },
  RR:     { label: "Resp Rate",      unit: "/min", color: "var(--vital-rr)" },
  TEMP:   { label: "Temperature",    unit: "°C",   color: "var(--vital-temp)" },
  BP_SYS: { label: "Blood Pressure", unit: "mmHg", color: "var(--vital-bp)" },
}

const DEFAULT_VITAL_CARDS: VitalCard[] = [
  { key: "hr",   label: "Heart Rate",     unit: "bpm",  normal: "Normal: 60-100",    color: "var(--vital-hr)",   min: 40,  max: 120 },
  { key: "spo2", label: "SpO2",           unit: "%",    normal: "Normal: 95-100",    color: "var(--vital-spo2)", min: 85,  max: 100 },
  { key: "rr",   label: "Resp Rate",      unit: "/min", normal: "Normal: 12-20",     color: "var(--vital-rr)",   min: 8,   max: 30  },
  { key: "temp", label: "Temperature",    unit: "°C",   normal: "Normal: 36.0-37.5", color: "var(--vital-temp)", min: 35,  max: 40  },
  { key: "bp",   label: "Blood Pressure", unit: "mmHg", normal: "Normal: 90-140",    color: "var(--vital-bp)",   min: 60,  max: 180 },
]

const PARAM_TO_KEY: Record<string, string> = {
  HR: "hr", SPO2: "spo2", RR: "rr", TEMP: "temp", BP_SYS: "bp",
}

function buildVitalCards(thresholds: ThresholdDTO[]): VitalCard[] {
  const map = new Map(thresholds.map((t) => [t.param_type, t]))
  return ["HR", "SPO2", "RR", "TEMP", "BP_SYS"].map((param) => {
    const meta = VITAL_CARD_META[param]
    const t = map.get(param)
    const key = PARAM_TO_KEY[param]
    if (!t || !meta) return DEFAULT_VITAL_CARDS.find((c) => c.key === key)!
    const wLow = t.warning_low ?? 0
    const wHigh = t.warning_high ?? 0
    const fmt = param === "TEMP" ? `${wLow.toFixed(1)}-${wHigh.toFixed(1)}` : `${Math.round(wLow)}-${Math.round(wHigh)}`
    return {
      key,
      label: meta.label,
      unit: meta.unit,
      color: meta.color,
      normal: `Normal: ${fmt}`,
      min: t.critical_low ?? wLow,
      max: t.critical_high ?? wHigh,
    }
  })
}

const trendColumns = [
  { key: "HR",   label: "HR" },
  { key: "SPO2", label: "SpO2" },
  { key: "RR",   label: "RR" },
  { key: "TEMP", label: "Temp" },
  { key: "BP",   label: "BP" },
]

const vitalColorMap: Record<string, string> = {
  HR:   "var(--vital-hr)",
  SPO2: "var(--vital-spo2)",
  RR:   "var(--vital-rr)",
  TEMP: "var(--vital-temp)",
  BP:   "var(--vital-bp)",
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getVitalValue(vitals: VitalsDTO, key: string): string {
  if (key === "hr") return vitals.hr != null ? String(Math.round(vitals.hr)) : "--"
  if (key === "spo2") return vitals.spo2 != null ? String(Math.round(vitals.spo2)) : "--"
  if (key === "rr") return vitals.rr != null ? String(Math.round(vitals.rr)) : "--"
  if (key === "temp") return vitals.temp != null ? vitals.temp.toFixed(1) : "--"
  if (key === "bp") return vitals.bp_systolic != null ? `${Math.round(vitals.bp_systolic)}/${Math.round(vitals.bp_diastolic ?? 0)}` : "--"
  return "--"
}

function calculateBarWidth(value: string, min: number, max: number): number {
  const num = parseFloat(value)
  if (isNaN(num)) return 0
  const clamped = Math.max(min, Math.min(max, num))
  return Math.round(((clamped - min) / (max - min)) * 100)
}

function groupObservationsByTime(observations: ObservationItem[]) {
  const map = new Map<string, Record<string, string>>()
  for (const obs of observations) {
    const time = toLocalHourMinute(obs.measured_at)
    const key = toLocalGroupKey(obs.measured_at)
    if (!map.has(key)) map.set(key, { time })
    const row = map.get(key)!
    if (obs.type === "BP") {
      row["BP"] = `${Math.round(obs.value ?? 0)}/${Math.round(obs.extra_value ?? 0)}`
    } else {
      row[obs.type] = obs.type === "TEMP" ? (obs.value ?? 0).toFixed(1) : String(Math.round(obs.value ?? 0))
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, row]) => row)
}

// ── ECG Panel ──────────────────────────────────────────────────────────────────
function EcgPanel() {
  return (
    <div className="bg-[#0d0e1a] rounded-xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] p-4 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-2">
        <p className="text-[11px] font-semibold text-[#4ade80]">ECG Lead II</p>
        <p className="text-[11px] text-[#808099]">250 Hz | 25mm/s</p>
      </div>
      <div className="relative h-[140px]">
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-[#262640]" style={{ top: `${(i + 1) * 25}%` }} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-[#262640]" style={{ left: `${(i + 1) * 9.5}%` }} />
          ))}
        </div>
        <svg viewBox="0 0 1060 140" className="w-full h-full relative z-10" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            points="0,70 80,70 100,70 110,65 120,70 140,70 150,70 160,25 170,115 180,10 190,130 200,70 230,70 310,70 330,70 340,65 350,70 370,70 380,70 390,25 400,115 410,10 420,130 430,70 460,70 540,70 560,70 570,65 580,70 600,70 610,70 620,25 630,115 640,10 650,130 660,70 690,70 770,70 790,70 800,65 810,70 830,70 840,70 850,25 860,115 870,10 880,130 890,70 920,70 1000,70 1020,70 1030,65 1040,70 1060,70"
          />
        </svg>
      </div>
    </div>
  )
}

// ── Client Component ───────────────────────────────────────────────────────────
export function PatientMonitorClient() {
  const searchParams = useSearchParams()
  const bedId = searchParams.get("bed")

  const [data, setData] = useState<BedMonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vitalCards, setVitalCards] = useState<VitalCard[]>(DEFAULT_VITAL_CARDS)

  const fetchData = useCallback(async () => {
    if (!bedId) return
    try {
      setLoading(true)
      setError(null)
      const [result, thresholds] = await Promise.all([
        apiGet<BedMonitorData>(`/proxy/monitors/beds/${bedId}/monitor`),
        apiGet<ThresholdDTO[]>("/proxy/alarm-settings").catch(() => null),
      ])
      setData(result)
      setVitalCards(thresholds ? buildVitalCards(thresholds) : DEFAULT_VITAL_CARDS)
    } catch (err) {
      setError("Failed to load patient monitor data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [bedId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!bedId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No bed specified.</p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading patient monitor...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  if (!data) return null

  const initials = data.patient_name.slice(0, 2).toUpperCase()
  const statusLabel = data.latest_alarm ? "Warning" : "Stable"
  const statusClass = data.latest_alarm ? "bg-status-warning-bg text-status-warning" : "bg-status-normal-bg text-status-normal"
  const rows = groupObservationsByTime(data.observations)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/monitoring/realtime-station"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-status-info hover:text-status-info/80 mb-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
        >
          ← Back to Realtime Station
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Patient Monitor</h1>
        <p className="text-sm text-muted-foreground">Single patient vital sign monitoring</p>
      </div>

      {/* Patient Info Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="bg-status-info-bg text-status-info text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">{data.patient_name}</p>
            <p className="text-xs text-muted-foreground">
              MRN: {data.patient_mrn} | {data.ward_name} - {data.bed_label} | Admitted: {toLocalDate(data.admitted_at)}
            </p>
          </div>
          <Badge className={cn("border-0 text-xs", statusClass)}>
            {statusLabel}
          </Badge>
        </CardContent>
      </Card>

      {/* 5 Vital Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {vitalCards.map(({ key, label, unit, normal, color, min, max }) => {
          const value = getVitalValue(data.vitals, key)
          const barWidth = calculateBarWidth(value.split("/")[0], min, max)
          return (
            <Card key={key} className="shadow-sm overflow-hidden">
              <div className="h-1" style={{ backgroundColor: color }} />
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</p>
                <p className={cn("text-[40px] font-bold leading-none mb-1", value === "--" && "opacity-40")} style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mb-1">{unit}</p>
                <p className="text-[11px] text-muted-foreground mb-2">{normal}</p>
                <div className="relative w-full h-[3px] rounded-[1px]">
                  <div className="absolute inset-0 rounded-[1px] opacity-30" style={{ backgroundColor: color }} />
                  <div className="relative h-full rounded-[1px]" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ECG Waveform */}
      <div>
        <h2 className="text-[15px] font-semibold text-foreground mb-2">ECG Waveform</h2>
        <EcgPanel />
      </div>

      {/* 24h Trend Summary */}
      <div>
        <h2 className="text-[15px] font-semibold text-foreground mb-2">24h Trend Summary</h2>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-3 text-xs font-semibold text-muted-foreground">Time</TableHead>
                    {trendColumns.map(({ key, label }) => (
                      <TableHead key={key} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No measurements in the last 24 hours.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => (
                      <TableRow key={idx} className={cn("border-b border-border", idx % 2 === 1 ? "bg-muted/50" : "bg-card")}>
                        <TableCell className="px-6 py-3 text-[13px] text-muted-foreground">{row.time}</TableCell>
                        {trendColumns.map(({ key }) => (
                          <TableCell
                            key={key}
                            className="px-4 py-3 text-[13px] font-semibold"
                            style={{ color: vitalColorMap[key] }}
                          >
                            {row[key] ?? "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

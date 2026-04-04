"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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

// ── Types ──────────────────────────────────────────────────────────────────────
type TimeRange = "1H" | "6H" | "12H" | "24H" | "7D"

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

interface PatientMeasurement {
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
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TIME_RANGES: TimeRange[] = ["1H", "6H", "12H", "24H", "7D"]

const VITAL_KEYS = ["HR", "SPO2", "RR", "TEMP", "BP"] as const

const VITAL_META: Record<string, { label: string; unit: string; color: string }> = {
  HR: { label: "Heart Rate", unit: "bpm", color: "var(--vital-hr)" },
  SPO2: { label: "SpO2", unit: "%", color: "var(--vital-spo2)" },
  RR: { label: "Resp Rate", unit: "rpm", color: "var(--vital-rr)" },
  TEMP: { label: "Temp", unit: "°C", color: "var(--vital-temp)" },
  BP: { label: "Blood Press", unit: "mmHg", color: "var(--vital-bp)" },
}

const trendColumns = [
  { key: "HR", label: "HR" },
  { key: "SPO2", label: "SpO2" },
  { key: "RR", label: "RR" },
  { key: "TEMP", label: "Temp" },
  { key: "BP", label: "BP" },
]

// ── SVG Sparkline helpers ──────────────────────────────────────────────────────
function buildLinePath(data: number[], w: number, h: number): string {
  if (data.length < 2) return ""
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 4
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return "M " + points.join(" L ")
}

function buildAreaPath(data: number[], w: number, h: number): string {
  if (data.length < 2) return ""
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 4
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }))
  const linePart = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")
  const lastX = pts[pts.length - 1].x.toFixed(1)
  const firstX = pts[0].x.toFixed(1)
  return `${linePart} L ${lastX} ${h} L ${firstX} ${h} Z`
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function groupObservationsByTime(observations: ObservationItem[]) {
  const map = new Map<string, Record<string, string>>()
  for (const obs of observations) {
    const time = obs.measured_at.slice(11, 16) // "HH:MM"
    const key = obs.measured_at.slice(0, 16) // "YYYY-MM-DDTHH:MM" for sorting
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

function extractSparklineData(observations: ObservationItem[], type: string): number[] {
  return observations
    .filter((o) => o.type === type && o.value !== null)
    .map((o) => o.value!)
}

function formatVitalValue(vitals: VitalsDTO, key: string): string {
  if (key === "HR") return vitals.hr != null ? String(Math.round(vitals.hr)) : "--"
  if (key === "SPO2") return vitals.spo2 != null ? String(Math.round(vitals.spo2)) : "--"
  if (key === "RR") return vitals.rr != null ? String(Math.round(vitals.rr)) : "--"
  if (key === "TEMP") return vitals.temp != null ? vitals.temp.toFixed(1) : "--"
  if (key === "BP") return vitals.bp_systolic != null ? `${Math.round(vitals.bp_systolic)}/${Math.round(vitals.bp_diastolic ?? 0)}` : "--"
  return "--"
}

// ── Client Component ───────────────────────────────────────────────────────────
export function MeasurementClient() {
  const searchParams = useSearchParams()
  const mrn = searchParams.get("mrn")

  const [data, setData] = useState<PatientMeasurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeRange, setActiveRange] = useState<TimeRange>("1H")

  const fetchData = useCallback(async (range: TimeRange) => {
    if (!mrn) return
    try {
      setLoading(true)
      setError(null)
      const result = await apiGet<PatientMeasurement>(
        `/proxy/patients/by-mrn/${encodeURIComponent(mrn)}/measurements?range=${range}`
      )
      setData(result)
    } catch (err) {
      setError("Failed to load measurement data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [mrn])

  useEffect(() => {
    fetchData(activeRange)
  }, [activeRange, fetchData])

  function handleRangeChange(range: TimeRange) {
    setActiveRange(range)
  }

  const W = 182
  const H = 50

  if (!mrn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No patient MRN provided.</p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading measurements...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={() => fetchData(activeRange)}>Retry</Button>
      </div>
    )
  }

  if (!data) return null

  const rows = groupObservationsByTime(data.observations)
  const initials = data.patient_name.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">
      {/* Back link + Page header */}
      <div>
        <Link
          href="/patients/list"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-status-info hover:text-status-info/80 mb-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
        >
          ← Back to Patient List
        </Link>
        <h1 className="text-[22px] font-bold text-foreground">Measurement History</h1>
        <p className="text-[14px] text-muted-foreground">Vital sign trends and historical data</p>
      </div>

      {/* Patient info card */}
      <Card className="shadow-sm">
        <CardContent className="flex items-center px-4 py-0 h-[80px]">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-status-info-bg text-status-info font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-bold text-foreground">{data.patient_name}</p>
              <p className="text-xs text-muted-foreground">
                MRN: {data.patient_mrn} &nbsp;|&nbsp; {data.ward_name} - {data.bed_label} &nbsp;|&nbsp; Admitted: {data.admitted_at.split("T")[0]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time range toggle */}
      <Card className="shadow-sm w-fit">
        <CardContent className="flex items-center gap-3 px-3 py-1">
          <span className="text-[12px] font-medium text-muted-foreground">Range:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={cn(
                  "w-[52px] h-[28px] rounded-md text-[12px] font-medium transition-colors",
                  activeRange === range
                    ? "bg-status-info text-white font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vital trend sparkline cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {VITAL_KEYS.map((key) => {
          const meta = VITAL_META[key]
          const sparkData = extractSparklineData(data.observations, key)
          const currentValue = formatVitalValue(data.vitals, key)
          return (
            <Card key={key} className="shadow-sm overflow-hidden">
              <div className="h-1" style={{ backgroundColor: meta.color }} />
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                  {meta.label}
                </p>
                <p
                  className="text-[28px] font-bold leading-none mb-1"
                  style={{ color: meta.color }}
                >
                  {currentValue}
                </p>
                <p className="text-[11px] text-muted-foreground mb-2">{meta.unit}</p>
                <div className="rounded-md overflow-hidden w-full" style={{ height: H }}>
                  {sparkData.length >= 2 ? (
                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                      <path d={buildAreaPath(sparkData, W, H)} fill={meta.color} opacity={0.18} />
                      <path d={buildLinePath(sparkData, W, H)} fill="none" stroke={meta.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground">No data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Measurements table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Recent Measurements</h2>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="bg-muted hover:bg-muted border-b border-border">
                    <TableHead className="px-6 py-3 text-[12px] font-semibold text-muted-foreground">Time</TableHead>
                    {trendColumns.map(({ key, label }) => (
                      <TableHead key={key} className="px-6 py-3 text-[12px] font-semibold text-muted-foreground">{label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No measurements in the selected time range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={cn(
                          "border-b border-border",
                          idx % 2 === 1 ? "bg-muted/50" : "bg-card"
                        )}
                      >
                        <TableCell className="px-6 py-3 text-[13px] text-muted-foreground">{row.time}</TableCell>
                        {trendColumns.map(({ key }) => (
                          <TableCell
                            key={key}
                            className="px-6 py-3 text-[13px] font-semibold"
                            style={{ color: VITAL_META[key]?.color }}
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

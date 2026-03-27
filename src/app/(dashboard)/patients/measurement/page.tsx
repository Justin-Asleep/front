"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────
type TimeRange = "1H" | "6H" | "12H" | "24H" | "7D"

// ── Constants ──────────────────────────────────────────────────────────────────
const TIME_RANGES: TimeRange[] = ["1H", "6H", "12H", "24H", "7D"]

const VITALS = [
  {
    key: "HR",
    label: "Heart Rate",
    value: "78",
    unit: "bpm",
    color: "#22c55e",
    bgColor: "#e5fdea",
    data: [72, 75, 71, 78, 82, 79, 74, 76, 73, 78],
  },
  {
    key: "SpO2",
    label: "SpO2",
    value: "97",
    unit: "%",
    color: "#38bdf8",
    bgColor: "#eaf7fe",
    data: [97, 98, 97, 96, 98, 99, 97, 98, 96, 97],
  },
  {
    key: "RR",
    label: "Resp Rate",
    value: "16",
    unit: "rpm",
    color: "#fbbf24",
    bgColor: "#fff9e5",
    data: [16, 17, 15, 18, 16, 17, 15, 16, 18, 16],
  },
  {
    key: "Temp",
    label: "Temperature",
    value: "36.8",
    unit: "°C",
    color: "#a78bfa",
    bgColor: "#f6f4ff",
    data: [36.5, 36.6, 36.7, 36.8, 36.9, 37.0, 36.8, 36.7, 36.6, 36.8],
  },
  {
    key: "BP",
    label: "Blood Press",
    value: "122/80",
    unit: "mmHg",
    color: "#f87171",
    bgColor: "#fff2f2",
    data: [118, 122, 120, 125, 119, 121, 123, 118, 120, 122],
  },
] as const

const mockMeasurements = [
  { time: "14:30", hr: 78, spo2: 97, rr: 16, temp: 36.8, bp: "122/80" },
  { time: "14:00", hr: 76, spo2: 97, rr: 15, temp: 36.7, bp: "120/78" },
  { time: "13:30", hr: 80, spo2: 96, rr: 17, temp: 36.9, bp: "125/82" },
  { time: "13:00", hr: 75, spo2: 98, rr: 16, temp: 36.6, bp: "118/76" },
  { time: "12:30", hr: 77, spo2: 97, rr: 15, temp: 36.8, bp: "121/79" },
  { time: "12:00", hr: 79, spo2: 97, rr: 16, temp: 36.8, bp: "123/81" },
]

// ── SVG Sparkline helpers ──────────────────────────────────────────────────────
function buildLinePath(data: readonly number[], w: number, h: number): string {
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

function buildAreaPath(data: readonly number[], w: number, h: number): string {
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

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MeasurementPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>("24H")

  const W = 182
  const H = 50

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Measurement History</h1>
        <p className="text-muted-foreground">Vital sign trends and historical data</p>
      </div>

      {/* Patient info card */}
      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="flex items-center justify-between px-4 py-0 h-[80px]">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] font-bold text-sm">
                KM
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[16px] font-bold text-[#111827]">Kim Minjun</p>
              <p className="text-[12px] text-[#9ca3af]">
                MRN: P-001234 &nbsp;|&nbsp; Ward 3 - Bed 301-1 &nbsp;|&nbsp; Admitted: 2026-03-20
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-[#f9fafb] border border-[#e5e7eb] text-[#4b5563] rounded-[8px] h-9 px-4 text-sm hover:bg-[#f3f4f6]"
          >
            Change Patient
          </Button>
        </CardContent>
      </Card>

      {/* Time range toggle */}
      <Card className="border border-[#e5e7eb] rounded-[8px] shadow-sm w-fit">
        <CardContent className="flex items-center gap-3 px-4 h-[44px] py-0">
          <span className="text-sm font-medium text-[#374151]">Range:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={cn(
                  "w-[52px] h-[28px] rounded-[6px] text-sm font-medium transition-colors",
                  activeRange === range
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#f9fafb] text-[#4b5563] hover:bg-[#f3f4f6]"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vital trend sparkline cards */}
      <div className="grid grid-cols-5 gap-4">
        {VITALS.map((v) => (
          <div
            key={v.key}
            className="flex flex-col rounded-[10px] bg-white border border-[#e5e7eb] overflow-hidden shadow-sm h-[156px]"
          >
            {/* Top color bar */}
            <div style={{ height: 4, backgroundColor: v.color, flexShrink: 0 }} />

            <div className="flex flex-col gap-1.5 px-3 pt-2 pb-3">
              {/* Parameter label */}
              <span className="text-[11px] text-[#9ca3af] font-semibold uppercase tracking-wide">
                {v.label}
              </span>

              {/* Value + unit */}
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[24px] font-bold leading-none"
                  style={{ color: v.color }}
                >
                  {v.value}
                </span>
                <span className="text-[11px] text-[#9ca3af]">{v.unit}</span>
              </div>

              {/* Sparkline */}
              <div
                className="rounded-[6px] overflow-hidden w-full"
                style={{ height: H, backgroundColor: v.bgColor }}
              >
                <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                  <path
                    d={buildAreaPath(v.data, W, H)}
                    fill={v.color}
                    opacity={0.18}
                  />
                  <path
                    d={buildLinePath(v.data, W, H)}
                    fill="none"
                    stroke={v.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Measurements table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">Recent Measurements</h2>
          <Button variant="outline" className="h-8 px-3 text-sm border-[#e5e7eb] text-[#4b5563]">
            Export CSV
          </Button>
        </div>

        <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Time
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#22c55e" }}>
                    HR
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#38bdf8" }}>
                    SpO2
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                    RR
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
                    Temp
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#f87171" }}>
                    BP
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMeasurements.map((row, idx) => (
                  <TableRow
                    key={row.time}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3 text-sm font-medium text-[#374151]">
                      {row.time}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold" style={{ color: "#22c55e" }}>
                      {row.hr}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold" style={{ color: "#38bdf8" }}>
                      {row.spo2}%
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold" style={{ color: "#fbbf24" }}>
                      {row.rr}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold" style={{ color: "#a78bfa" }}>
                      {row.temp}°C
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold" style={{ color: "#f87171" }}>
                      {row.bp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

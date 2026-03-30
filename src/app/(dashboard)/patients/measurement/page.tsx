"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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
    color: "#38bef8",
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
    label: "Temp",
    value: "36.8",
    unit: "C",
    color: "#a78bfb",
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
      {/* Back link + Page header */}
      <div>
        <Link
          href="/patients/list"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2563eb] hover:text-[#1d4ed8] mb-2"
        >
          ← Back to Patient List
        </Link>
        <h1 className="text-[22px] font-bold text-[#111827]">Measurement History</h1>
        <p className="text-[14px] text-[#4b5563]">Vital sign trends and historical data</p>
      </div>

      {/* Patient info card */}
      <Card className="rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
        <CardContent className="flex items-center px-4 py-0 h-[80px]">
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
        </CardContent>
      </Card>

      {/* Time range toggle */}
      <div className="rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] bg-white w-fit">
        <div className="flex items-center gap-3 px-3 h-[36px]">
          <span className="text-[12px] font-medium text-[#9ca3af]">Range:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={cn(
                  "w-[52px] h-[28px] rounded-[6px] text-[12px] font-medium transition-colors",
                  activeRange === range
                    ? "bg-[#2563eb] text-white font-semibold"
                    : "bg-[#f9fafb] text-[#4b5563] hover:bg-[#f3f4f6]"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vital trend sparkline cards */}
      <div className="grid grid-cols-5 gap-4">
        {VITALS.map((v) => (
          <div
            key={v.key}
            className="flex flex-col rounded-[12px] bg-white overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)] h-[156px]"
          >
            {/* Top color bar */}
            <div style={{ height: 4, backgroundColor: v.color, flexShrink: 0 }} />

            <div className="flex flex-col gap-1 px-3.5 pt-2.5 pb-3">
              {/* Parameter label */}
              <span className="text-[11px] text-[#9ca3af] font-semibold">
                {v.label}
              </span>

              {/* Value */}
              <span
                className="text-[24px] font-bold leading-none"
                style={{ color: v.color }}
              >
                {v.value}
              </span>

              {/* Unit */}
              <span className="text-[11px] text-[#9ca3af]">{v.unit}</span>

              {/* Sparkline */}
              <div
                className="rounded-[6px] overflow-hidden w-full mt-1"
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
          <h2 className="text-[15px] font-semibold text-[#111827]">Recent Measurements</h2>
          <button className="h-[32px] w-[100px] border border-[#d1d5db] rounded-[6px] text-[12px] font-medium text-[#4b5563] bg-white hover:bg-[#f9fafb]">
            Export CSV
          </button>
        </div>

        <Card className="rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Time</TableHead>
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">HR</TableHead>
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">SpO2</TableHead>
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">RR</TableHead>
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Temp</TableHead>
                  <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">BP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMeasurements.map((row, idx) => (
                  <TableRow
                    key={row.time}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#fbfbfc]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-6 py-3 text-[13px] text-[#4b5563]">{row.time}</TableCell>
                    <TableCell className="px-6 py-3 text-[13px] font-semibold" style={{ color: "#22c55e" }}>{row.hr}</TableCell>
                    <TableCell className="px-6 py-3 text-[13px] font-semibold" style={{ color: "#38bef8" }}>{row.spo2}</TableCell>
                    <TableCell className="px-6 py-3 text-[13px] font-semibold" style={{ color: "#fbbf24" }}>{row.rr}</TableCell>
                    <TableCell className="px-6 py-3 text-[13px] font-semibold" style={{ color: "#a78bfb" }}>{row.temp}</TableCell>
                    <TableCell className="px-6 py-3 text-[13px] font-semibold" style={{ color: "#f87171" }}>{row.bp}</TableCell>
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

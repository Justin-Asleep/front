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
    color: "var(--vital-hr)",
    data: [72, 75, 71, 78, 82, 79, 74, 76, 73, 78],
  },
  {
    key: "SpO2",
    label: "SpO2",
    value: "97",
    unit: "%",
    color: "var(--vital-spo2)",
    data: [97, 98, 97, 96, 98, 99, 97, 98, 96, 97],
  },
  {
    key: "RR",
    label: "Resp Rate",
    value: "16",
    unit: "rpm",
    color: "var(--vital-rr)",
    data: [16, 17, 15, 18, 16, 17, 15, 16, 18, 16],
  },
  {
    key: "Temp",
    label: "Temp",
    value: "36.8",
    unit: "°C",
    color: "var(--vital-temp)",
    data: [36.5, 36.6, 36.7, 36.8, 36.9, 37.0, 36.8, 36.7, 36.6, 36.8],
  },
  {
    key: "BP",
    label: "Blood Press",
    value: "122/80",
    unit: "mmHg",
    color: "var(--vital-bp)",
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

const vitalColorMap: Record<string, string> = {
  hr: "var(--vital-hr)",
  spo2: "var(--vital-spo2)",
  rr: "var(--vital-rr)",
  temp: "var(--vital-temp)",
  bp: "var(--vital-bp)",
}

const trendColumns: Array<{ key: keyof (typeof mockMeasurements)[0]; label: string }> = [
  { key: "hr", label: "HR" },
  { key: "spo2", label: "SpO2" },
  { key: "rr", label: "RR" },
  { key: "temp", label: "Temp" },
  { key: "bp", label: "BP" },
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

// ── Client Component ───────────────────────────────────────────────────────────
export function MeasurementClient() {
  const [activeRange, setActiveRange] = useState<TimeRange>("24H")

  const W = 182
  const H = 50

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
                KM
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-bold text-foreground">Kim Minjun</p>
              <p className="text-xs text-muted-foreground">
                MRN: P-001234 &nbsp;|&nbsp; Ward 3 - Bed 301-1 &nbsp;|&nbsp; Admitted: 2026-03-20
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
                onClick={() => setActiveRange(range)}
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
        {VITALS.map((v) => (
          <Card key={v.key} className="shadow-sm overflow-hidden">
            <div className="h-1" style={{ backgroundColor: v.color }} />
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                {v.label}
              </p>
              <p
                className="text-[28px] font-bold leading-none mb-1"
                style={{ color: v.color }}
              >
                {v.value}
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">{v.unit}</p>
              <div
                className="rounded-md overflow-hidden w-full"
                style={{ height: H }}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Measurements table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Recent Measurements</h2>
          <button className="h-8 px-4 border border-border rounded-md text-[12px] font-medium text-muted-foreground bg-card hover:bg-muted transition-colors">
            Export CSV
          </button>
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
                  {mockMeasurements.map((row, idx) => (
                    <TableRow
                      key={row.time}
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
                          style={{ color: vitalColorMap[key] }}
                        >
                          {row[key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

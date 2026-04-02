"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const patient = {
  name: "Kim Minjun",
  initials: "KM",
  mrn: "P-001234",
  bed: "Bed 301-1",
  doctor: "Dr. Park",
  admitted: "2026-03-20",
  status: "Stable",
}

function calculateBarWidth(value: string, min: number, max: number): number {
  const num = parseFloat(value)
  if (isNaN(num)) return 0
  const clamped = Math.max(min, Math.min(max, num))
  return Math.round(((clamped - min) / (max - min)) * 100)
}

const vitalCards = [
  { label: "Heart Rate",     value: "72",     unit: "bpm",  normal: "Normal: 60-100",    color: "var(--vital-hr)",   min: 40,  max: 120 },
  { label: "SpO2",           value: "98",     unit: "%",    normal: "Normal: 95-100",    color: "var(--vital-spo2)", min: 85,  max: 100 },
  { label: "Resp Rate",      value: "16",     unit: "/min", normal: "Normal: 12-20",     color: "var(--vital-rr)",   min: 8,   max: 30  },
  { label: "Temperature",    value: "36.5",   unit: "°C",   normal: "Normal: 36.0-37.5", color: "var(--vital-temp)", min: 35,  max: 40  },
  { label: "Blood Pressure", value: "120/80", unit: "mmHg", normal: "Normal: 90-140",    color: "var(--vital-bp)",   min: 60,  max: 180 },
]

const trendData = [
  { time: "06:00",       hr: "68", spo2: "99", rr: "14", temp: "36.4", bp: "116/74" },
  { time: "10:00",       hr: "72", spo2: "98", rr: "15", temp: "36.5", bp: "118/76" },
  { time: "14:00",       hr: "78", spo2: "97", rr: "16", temp: "36.8", bp: "122/80" },
  { time: "18:00 (est)", hr: "--", spo2: "--", rr: "--", temp: "--",   bp: "--"     },
]

const vitalColorMap: Record<string, string> = {
  hr:   "var(--vital-hr)",
  spo2: "var(--vital-spo2)",
  rr:   "var(--vital-rr)",
  temp: "var(--vital-temp)",
  bp:   "var(--vital-bp)",
}

const trendColumns: Array<{ key: keyof typeof trendData[0]; label: string }> = [
  { key: "hr",   label: "HR"   },
  { key: "spo2", label: "SpO2" },
  { key: "rr",   label: "RR"   },
  { key: "temp", label: "Temp" },
  { key: "bp",   label: "BP"   },
]

function EcgPanel() {
  return (
    <div
      className="bg-[#0d0e1a] rounded-xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] p-4 relative overflow-hidden"
      aria-label="ECG Lead II — real-time waveform display"
    >
      <div className="flex items-center gap-4 mb-2">
        <p className="text-[11px] font-semibold text-[#4ade80]">ECG Lead II</p>
        <p className="text-[11px] text-[#808099]">250 Hz | 25mm/s</p>
      </div>
      <div className="relative h-[140px]">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-[#262640]" style={{ top: `${(i + 1) * 25}%` }} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-[#262640]" style={{ left: `${(i + 1) * 9.5}%` }} />
          ))}
        </div>
        {/* ECG waveform */}
        <svg
          viewBox="0 0 1060 140"
          className="w-full h-full relative z-10"
          preserveAspectRatio="none"
          role="img"
          aria-label="ECG Lead II waveform — active signal"
        >
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

export function PatientMonitorClient() {
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
              {patient.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">{patient.name}</p>
            <p className="text-xs text-muted-foreground">
              MRN: {patient.mrn} | {patient.bed} | {patient.doctor} | Admitted: {patient.admitted}
            </p>
          </div>
          <Badge className="bg-status-normal-bg text-status-normal border-0 text-xs">
            {patient.status}
          </Badge>
        </CardContent>
      </Card>

      {/* 5 Vital Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {vitalCards.map(({ label, value, unit, normal, color, min, max }) => {
          const barWidth = calculateBarWidth(value.split("/")[0], min, max)
          return (
            <Card key={label} className="shadow-sm overflow-hidden">
              <div className="h-1" style={{ backgroundColor: color }} />
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</p>
                <p className="text-[40px] font-bold leading-none mb-1" style={{ color }}>{value}</p>
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
                  {trendData.map((row) => {
                    const isPending = row.hr === "--"
                    return (
                      <TableRow key={row.time} className={cn("border-b border-border", isPending && "opacity-60 italic")}>
                        <TableCell className="px-6 py-3 text-[13px] text-muted-foreground">{row.time}</TableCell>
                        {trendColumns.map(({ key }) => (
                          <TableCell
                            key={key}
                            className="px-4 py-3 text-[13px] font-semibold"
                            style={{ color: isPending ? undefined : vitalColorMap[key] }}
                          >
                            {row[key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

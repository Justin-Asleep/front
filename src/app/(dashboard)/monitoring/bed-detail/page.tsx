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

const vitalCards = [
  { label: "Heart Rate",      value: "72",     unit: "bpm",  normal: "Normal: 60-100",   color: "#22c55e", barWidth: 70 },
  { label: "SpO2",            value: "98",     unit: "%",    normal: "Normal: 95-100",   color: "#38bdf8", barWidth: 70 },
  { label: "Resp Rate",       value: "16",     unit: "/min", normal: "Normal: 12-20",    color: "#fbbf24", barWidth: 70 },
  { label: "Temperature",     value: "36.5",   unit: "C",    normal: "Normal: 36.0-37.5", color: "#a78bfb", barWidth: 70 },
  { label: "Blood Pressure",  value: "120/80", unit: "mmHg", normal: "Normal: 90-140",   color: "#f87171", barWidth: 70 },
]

const trendData = [
  { time: "06:00",       hr: "68", spo2: "99", rr: "14", temp: "36.4", bp: "116/74" },
  { time: "10:00",       hr: "72", spo2: "98", rr: "15", temp: "36.5", bp: "118/76" },
  { time: "14:00",       hr: "78", spo2: "97", rr: "16", temp: "36.8", bp: "122/80" },
  { time: "18:00 (est)", hr: "--", spo2: "--", rr: "--", temp: "--",   bp: "--" },
]

function EcgPanel() {
  return (
    <div className="bg-[#0d0e1a] rounded-xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] p-4 relative overflow-hidden">
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

export default function BedDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/monitoring/realtime-station"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2563eb] hover:text-[#1d4ed8] mb-2"
        >
          ← Back to Realtime Station
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Bed Detail</h1>
        <p className="text-sm text-[#4b5563]">Single patient vital sign monitoring</p>
      </div>

      {/* Patient Info Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] text-sm font-bold">
              {patient.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-base font-bold text-[#111827]">{patient.name}</p>
            <p className="text-xs text-[#9ca3af]">
              MRN: {patient.mrn} | {patient.bed} | {patient.doctor} | Admitted: {patient.admitted}
            </p>
          </div>
          <Badge className="bg-[#dcfce7] text-[#16a34a] border-0 text-xs">
            {patient.status}
          </Badge>
        </CardContent>
      </Card>

      {/* 5 Vital Cards */}
      <div className="grid grid-cols-5 gap-4">
        {vitalCards.map(({ label, value, unit, normal, color, barWidth }) => (
          <Card key={label} className="shadow-sm overflow-hidden">
            <div className="h-1" style={{ backgroundColor: color }} />
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-[#9ca3af] mb-1">{label}</p>
              <p className="text-[40px] font-bold leading-none mb-1" style={{ color }}>{value}</p>
              <p className="text-xs text-[#9ca3af] mb-1">{unit}</p>
              <p className="text-[11px] text-[#9ca3af] mb-2">{normal}</p>
              <div className="w-full h-[3px] rounded-[1px]" style={{ backgroundColor: `${color}4D` }}>
                <div className="h-full rounded-[1px]" style={{ width: `${barWidth}%`, backgroundColor: color }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ECG Waveform */}
      <div>
        <p className="text-[15px] font-semibold text-[#111827] mb-2">ECG Waveform</p>
        <EcgPanel />
      </div>

      {/* 24h Trend Summary */}
      <div>
        <p className="text-[15px] font-semibold text-[#111827] mb-2">24h Trend Summary</p>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#e5e7eb]">
                  <TableHead className="px-6 py-3 text-xs font-semibold text-[#9ca3af]">Time</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">HR</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">SpO2</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">RR</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">Temp</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af]">BP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendData.map((row) => {
                  const isPending = row.hr === "--"
                  return (
                    <TableRow key={row.time} className="border-b border-[#e5e7eb]">
                      <TableCell className="px-6 py-3 text-[13px] text-[#4b5563]">{row.time}</TableCell>
                      <TableCell className={cn("px-4 py-3 text-[13px] font-semibold", isPending ? "text-[#4b5563]" : "text-[#22c55e]")}>{row.hr}</TableCell>
                      <TableCell className={cn("px-4 py-3 text-[13px] font-semibold", isPending ? "text-[#4b5563]" : "text-[#38bdf8]")}>{row.spo2}</TableCell>
                      <TableCell className={cn("px-4 py-3 text-[13px] font-semibold", isPending ? "text-[#4b5563]" : "text-[#fbbf24]")}>{row.rr}</TableCell>
                      <TableCell className={cn("px-4 py-3 text-[13px] font-semibold", isPending ? "text-[#4b5563]" : "text-[#a78bfb]")}>{row.temp}</TableCell>
                      <TableCell className={cn("px-4 py-3 text-[13px] font-semibold", isPending ? "text-[#4b5563]" : "text-[#f87171]")}>{row.bp}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History } from "lucide-react"
import { cn } from "@/lib/utils"
import { AlarmHistoryModal } from "@/components/monitoring/alarm-history-modal"

type Severity = "CRITICAL" | "WARNING"
type AlarmStatus = "Active" | "Acknowledged" | "Resolved"

type Alarm = {
  id: string
  severity: Severity
  bed: string
  patient: string
  param: string
  paramColor: string
  value: string
  threshold: string
  time: string
  status: AlarmStatus
}

const mockAlarms: Alarm[] = [
  { id: "1", severity: "CRITICAL", bed: "301-2", patient: "Park Soyeon",   param: "SpO2", paramColor: "text-[#38bdf8]", value: "92%",    threshold: "< 94%",  time: "14:31", status: "Active" },
  { id: "2", severity: "CRITICAL", bed: "302-1", patient: "Choi Yuna",     param: "HR",   paramColor: "text-[#22c55e]", value: "102",    threshold: "> 100",  time: "14:28", status: "Active" },
  { id: "3", severity: "WARNING",  bed: "301-2", patient: "Park Soyeon",   param: "Temp", paramColor: "text-[#a78bfb]", value: "37.8",   threshold: "> 37.5", time: "14:25", status: "Active" },
  { id: "4", severity: "WARNING",  bed: "302-3", patient: "Jung Hyunwoo",  param: "RR",   paramColor: "text-[#fbbf24]", value: "22",     threshold: "> 20",   time: "14:20", status: "Active" },
  { id: "5", severity: "WARNING",  bed: "303-1", patient: "Yoon Jiyeon",   param: "BP",   paramColor: "text-[#f87171]", value: "142/88", threshold: "> 140",  time: "14:15", status: "Active" },
  { id: "6", severity: "WARNING",  bed: "302-1", patient: "Choi Yuna",     param: "Temp", paramColor: "text-[#a78bfb]", value: "38.1",   threshold: "> 37.5", time: "14:10", status: "Acknowledged" },
  { id: "7", severity: "WARNING",  bed: "303-4", patient: "Oh Donghyun",   param: "HR",   paramColor: "text-[#22c55e]", value: "58",     threshold: "< 60",   time: "13:50", status: "Acknowledged" },
  { id: "8", severity: "CRITICAL", bed: "301-3", patient: "Lee Jungho",    param: "SpO2", paramColor: "text-[#38bdf8]", value: "89%",    threshold: "< 90%",  time: "13:30", status: "Resolved" },
]

const statCards = [
  { label: "Active Critical",  value: 2,  borderColor: "bg-[#ef4444]", valueColor: "text-[#ef4444]" },
  { label: "Active Warning",   value: 5,  borderColor: "bg-[#f97316]", valueColor: "text-[#f97316]" },
  { label: "Resolved Today",   value: 12, borderColor: "bg-[#9ca3af]", valueColor: "text-[#9ca3af]" },
]

const severityBadgeClass: Record<Severity, string> = {
  CRITICAL: "bg-[#fef2f2] text-[#ef4444] border-0 font-bold",
  WARNING:  "bg-[#fff7ed] text-[#f97316] border-0 font-bold",
}

const statusBadgeClass: Record<AlarmStatus, string> = {
  Active:       "bg-[#fef2f2] text-[#ef4444] border-0",
  Acknowledged: "bg-[#fff7ed] text-[#f97316] border-0",
  Resolved:     "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function AlarmStatusPage() {
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Alarm Status</h1>
          <p className="text-sm text-[#4b5563]">Active alarms and alarm history</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setHistoryOpen(true)}
        >
          <History className="size-4" />
          Alarm History
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, borderColor, valueColor }) => (
          <Card key={label} className="shadow-sm overflow-hidden">
            <CardContent className="p-0 flex">
              <div className={cn("w-1 self-stretch flex-shrink-0", borderColor)} />
              <div className="px-6 py-3">
                <p className={cn("text-[26px] font-bold", valueColor)}>{value}</p>
                <p className="text-[13px] text-[#4b5563]">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alarm Table */}
      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Severity</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Bed</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Patient</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Param</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Value</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Threshold</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Time</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAlarms.map((alarm, idx) => {
                const isCriticalRow = alarm.severity === "CRITICAL" && alarm.status !== "Resolved"
                return (
                  <TableRow
                    key={alarm.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      isCriticalRow ? "bg-[#fef2f2]" : idx % 2 === 1 ? "bg-[#fcfcfe]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-6 py-3">
                      <Badge className={cn("text-[10px]", severityBadgeClass[alarm.severity])}>{alarm.severity}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-[13px] text-[#111827]">{alarm.bed}</TableCell>
                    <TableCell className="px-4 py-3 text-[13px] text-[#111827]">{alarm.patient}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={cn("text-[13px] font-semibold", alarm.paramColor)}>{alarm.param}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={cn(
                        "text-[13px] font-bold",
                        alarm.severity === "CRITICAL" ? "text-[#ef4444]" : "text-[#f97316]"
                      )}>
                        {alarm.value}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#9ca3af]">{alarm.threshold}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#4b5563]">{alarm.time}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={cn("text-[10px]", statusBadgeClass[alarm.status])}>{alarm.status}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlarmHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        stationName="Internal Medicine Station"
      />
    </div>
  )
}

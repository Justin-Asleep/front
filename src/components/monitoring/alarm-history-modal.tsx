"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Severity = "CRITICAL" | "WARNING"
type TimeFilter = "1H" | "6H" | "24H" | "7D"
type SeverityFilter = "All" | "Critical" | "Warning"

type AlarmRecord = {
  id: string
  severity: Severity
  bed: string
  patient: string
  param: string
  value: string
  threshold: string
  time: string
}

const mockHistory: AlarmRecord[] = [
  { id: "1",  severity: "CRITICAL", bed: "301-2", patient: "Park Soyeon",  param: "SpO2", value: "92%",    threshold: "<94%",   time: "3m ago" },
  { id: "2",  severity: "CRITICAL", bed: "302-1", patient: "Choi Yuna",    param: "HR",   value: "102",    threshold: ">100",   time: "6m ago" },
  { id: "3",  severity: "WARNING",  bed: "301-2", patient: "Park Soyeon",  param: "Temp", value: "37.8",   threshold: ">37.5",  time: "9m ago" },
  { id: "4",  severity: "WARNING",  bed: "302-3", patient: "Jung Hyunwoo", param: "RR",   value: "22",     threshold: ">20",    time: "15m ago" },
  { id: "5",  severity: "WARNING",  bed: "303-1", patient: "Yoon Jiyeon",  param: "BP",   value: "142/88", threshold: ">140",   time: "20m ago" },
  { id: "6",  severity: "WARNING",  bed: "302-1", patient: "Choi Yuna",    param: "Temp", value: "38.1",   threshold: ">37.5",  time: "25m ago" },
  { id: "7",  severity: "WARNING",  bed: "303-4", patient: "Oh Donghyun",  param: "HR",   value: "58",     threshold: "<60",    time: "45m ago" },
  { id: "8",  severity: "CRITICAL", bed: "301-3", patient: "Lee Jungho",   param: "SpO2", value: "89%",    threshold: "<90%",   time: "1h ago" },
  { id: "9",  severity: "WARNING",  bed: "302-2", patient: "J. Hyunwoo",   param: "HR",   value: "95",     threshold: ">90",    time: "2h ago" },
  { id: "10", severity: "WARNING",  bed: "303-3", patient: "Shin Areum",   param: "RR",   value: "21",     threshold: ">20",    time: "3h ago" },
  { id: "11", severity: "CRITICAL", bed: "301-1", patient: "Kim Minjun",   param: "SpO2", value: "91%",    threshold: "<94%",   time: "4h ago" },
  { id: "12", severity: "WARNING",  bed: "303-2", patient: "Bae Junho",    param: "Temp", value: "37.6",   threshold: ">37.5",  time: "5h ago" },
  { id: "13", severity: "WARNING",  bed: "302-4", patient: "Kang Seojun",  param: "HR",   value: "97",     threshold: ">90",    time: "6h ago" },
  { id: "14", severity: "WARNING",  bed: "301-4", patient: "Han Minji",    param: "RR",   value: "23",     threshold: ">20",    time: "8h ago" },
  { id: "15", severity: "CRITICAL", bed: "302-1", patient: "Choi Yuna",    param: "HR",   value: "108",    threshold: ">100",   time: "10h ago" },
  { id: "16", severity: "WARNING",  bed: "303-1", patient: "Yoon Jiyeon",  param: "BP",   value: "138/86", threshold: ">140",   time: "12h ago" },
  { id: "17", severity: "WARNING",  bed: "301-2", patient: "Park Soyeon",  param: "SpO2", value: "94%",    threshold: "<95%",   time: "14h ago" },
  { id: "18", severity: "WARNING",  bed: "302-3", patient: "Jung Hyunwoo", param: "Temp", value: "37.7",   threshold: ">37.5",  time: "18h ago" },
  { id: "19", severity: "CRITICAL", bed: "303-4", patient: "Oh Donghyun",  param: "SpO2", value: "88%",    threshold: "<90%",   time: "22h ago" },
]

const PAGE_SIZE = 10
const TIME_FILTERS: TimeFilter[] = ["1H", "6H", "24H", "7D"]
const SEVERITY_FILTERS: SeverityFilter[] = ["All", "Critical", "Warning"]

const severityBadgeClass: Record<Severity, string> = {
  CRITICAL: "bg-[#fff2f2] text-[#ef4444] border-0 font-bold text-[10px] h-5 px-2 rounded",
  WARNING:  "bg-[#fff7ed] text-[#f97316] border-0 font-bold text-[10px] h-5 px-2 rounded",
}

const paramColorBySeverity: Record<Severity, string> = {
  CRITICAL: "text-[#ef4444]",
  WARNING:  "text-[#f97316]",
}

const dateRangeLabel: Record<TimeFilter, string> = {
  "1H":  "2026-03-30 13:00 ~ 14:00",
  "6H":  "2026-03-30 08:00 ~ 14:00",
  "24H": "2026-03-29 00:00 ~ 23:59",
  "7D":  "2026-03-23 ~ 2026-03-30",
}

interface AlarmHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stationName?: string
}

export function AlarmHistoryModal({
  open,
  onOpenChange,
  stationName = "Internal Medicine Station",
}: AlarmHistoryModalProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24H")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (severityFilter === "All") return mockHistory
    const target = severityFilter.toUpperCase() as Severity
    return mockHistory.filter((a) => a.severity === target)
  }, [severityFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const criticalCount = mockHistory.filter((a) => a.severity === "CRITICAL").length
  const warningCount  = mockHistory.filter((a) => a.severity === "WARNING").length
  const resolvedCount = 12

  function handleTimeFilter(f: TimeFilter) {
    setTimeFilter(f)
    setPage(1)
  }

  function handleSeverityFilter(f: SeverityFilter) {
    setSeverityFilter(f)
    setPage(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1024px] w-full p-0 gap-0 overflow-hidden" showCloseButton={true}>
        {/* Header */}
        <DialogHeader className="px-8 pt-5 pb-0 gap-0">
          <DialogTitle className="text-[18px] font-semibold text-[#12171c]">Alarm History</DialogTitle>
          <p className="text-[13px] text-[#6b737d] mt-0.5">{stationName}</p>
        </DialogHeader>

        {/* Separator */}
        <div className="h-px bg-[#e8ebed] mt-3" />

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-8 py-2.5">
          {/* Time filter buttons */}
          {TIME_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleTimeFilter(f)}
              className={cn(
                "h-7 w-11 rounded-md border text-[12px] font-medium",
                timeFilter === f
                  ? "bg-[#2563eb] border-[#2563eb] text-white"
                  : "bg-white border-[#e8ebed] text-[#6b737d] hover:bg-[#f9fafb]"
              )}
            >
              {f}
            </button>
          ))}

          {/* Date range */}
          <div className="h-7 flex items-center px-2 rounded-md border border-[#e8ebed] bg-white text-[11px] text-[#38404a] w-[220px]">
            {dateRangeLabel[timeFilter]}
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => handleSeverityFilter(e.target.value as SeverityFilter)}
              className="h-7 pl-2 pr-6 rounded-md border border-[#e8ebed] bg-white text-[12px] text-[#38404a] appearance-none cursor-pointer outline-none"
            >
              {SEVERITY_FILTERS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a1a8b2]">▾</span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-[#e8ebed]" />

        {/* Stats summary */}
        <div className="flex items-center gap-0 px-8 py-2">
          <span className="inline-block size-2 rounded-[2px] bg-[#ef4444] mr-1.5" />
          <span className="text-[12px] font-medium text-[#ef4444] mr-6">Critical: {criticalCount}</span>
          <span className="inline-block size-2 rounded-[2px] bg-[#f97316] mr-1.5" />
          <span className="text-[12px] font-medium text-[#f97316] mr-6">Warning: {warningCount}</span>
          <span className="inline-block size-2 rounded-[2px] bg-[#21c45e] mr-1.5" />
          <span className="text-[12px] font-medium text-[#21c45e]">Resolved: {resolvedCount}</span>
          <span className="ml-auto text-[12px] text-[#a1a8b2]">
            Total: {mockHistory.length} alarms in {timeFilter}
          </span>
        </div>

        {/* Separator */}
        <div className="h-px bg-[#e8ebed]" />

        {/* Table */}
        <div className="overflow-auto max-h-[420px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#fafafa] hover:bg-[#fafafa] border-b border-[#e8ebed]">
                <TableHead className="px-8 py-2 text-[10px] font-medium text-[#6b737d] w-[110px]">Severity</TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-medium text-[#6b737d] w-[80px]">Bed</TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-medium text-[#6b737d] w-[160px]">Patient</TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-medium text-[#6b737d] w-[80px]">Param</TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-medium text-[#6b737d]">Value (Threshold)</TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-medium text-[#6b737d] w-[100px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((alarm, idx) => (
                <TableRow
                  key={alarm.id}
                  className={cn(
                    "border-b border-[#f2f2f5]",
                    idx % 2 === 0 ? "bg-white" : "bg-[#fafafc]"
                  )}
                >
                  <TableCell className="px-8 py-2.5">
                    <Badge className={severityBadgeClass[alarm.severity]}>
                      {alarm.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-[12px] text-[#38404a]">{alarm.bed}</TableCell>
                  <TableCell className="px-4 py-2.5 text-[12px] text-[#12171c]">{alarm.patient}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <span className={cn("text-[12px] font-medium", paramColorBySeverity[alarm.severity])}>
                      {alarm.param}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-[12px] font-bold text-[#38404a]">
                    {alarm.value} ({alarm.threshold})
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-[11px] text-[#a1a8b2]">{alarm.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Separator */}
        <div className="h-px bg-[#e8ebed]" />

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-8 py-3">
          <span className="text-[12px] text-[#a1a8b2]">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} alarms
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="size-7 flex items-center justify-center rounded-md border border-[#e8ebed] bg-white text-[12px] font-medium text-[#6b737d] disabled:opacity-40"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "size-7 flex items-center justify-center rounded-md border text-[12px] font-medium",
                  p === page
                    ? "bg-[#2563eb] border-[#2563eb] text-white"
                    : "bg-white border-[#e8ebed] text-[#6b737d] hover:bg-[#f9fafb]"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="size-7 flex items-center justify-center rounded-md border border-[#e8ebed] bg-white text-[12px] font-medium text-[#6b737d] disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

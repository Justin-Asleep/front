"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { apiGet } from "@/services/api"

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
type TimeFilter = "1H" | "6H" | "24H" | "7D"
type SeverityFilter = "All" | "CRITICAL" | "HIGH"

interface AlarmFromAPI {
  id: number
  severity: string
  param: string
  value: number
  extra_value: number | null
  threshold: string
  message: string
  triggered_at: string
  bed_label: string
  patient_name: string
}

interface PaginatedAlarms {
  items: AlarmFromAPI[]
  total: number
  page: number
  size: number
}

const PAGE_SIZE = 10
const TIME_FILTERS: TimeFilter[] = ["1H", "6H", "24H", "7D"]
const SEVERITY_FILTERS: SeverityFilter[] = ["All", "CRITICAL", "HIGH"]

const severityBadgeClass: Record<string, string> = {
  CRITICAL: "bg-[#fff2f2] text-[#ef4444] border-0 font-bold text-[10px] h-5 px-2 rounded",
  HIGH:     "bg-[#fff7ed] text-[#f97316] border-0 font-bold text-[10px] h-5 px-2 rounded",
  MEDIUM:   "bg-[#fffbeb] text-[#eab308] border-0 font-bold text-[10px] h-5 px-2 rounded",
  LOW:      "bg-[#f0fdf4] text-[#22c55e] border-0 font-bold text-[10px] h-5 px-2 rounded",
}

const paramColorBySeverity: Record<string, string> = {
  CRITICAL: "text-[#ef4444]",
  HIGH:     "text-[#f97316]",
  MEDIUM:   "text-[#eab308]",
  LOW:      "text-[#22c55e]",
}

function getTimeRange(filter: TimeFilter): { from: string; to: string; label: string } {
  const now = new Date()
  const to = now.toISOString()
  const from = new Date(now)

  switch (filter) {
    case "1H":  from.setHours(from.getHours() - 1); break
    case "6H":  from.setHours(from.getHours() - 6); break
    case "24H": from.setHours(from.getHours() - 24); break
    case "7D":  from.setDate(from.getDate() - 7); break
  }

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  return { from: from.toISOString(), to, label: `${fmt(from)} ~ ${fmt(now)}` }
}

function formatValue(alarm: AlarmFromAPI): string {
  if (alarm.param === "BP" && alarm.extra_value != null) {
    return `${Math.round(alarm.value)}/${Math.round(alarm.extra_value)}`
  }
  if (alarm.param === "TEMP") return alarm.value.toFixed(1)
  return String(Math.round(alarm.value))
}

function formatTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AlarmHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stationName?: string
  wardId?: string
}

export function AlarmHistoryModal({
  open,
  onOpenChange,
  stationName = "",
  wardId,
}: AlarmHistoryModalProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24H")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All")
  const [page, setPage] = useState(1)
  const [alarms, setAlarms] = useState<AlarmFromAPI[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchAlarms = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getTimeRange(timeFilter)
      const params = new URLSearchParams({
        from,
        to,
        page: String(page),
        size: String(PAGE_SIZE),
      })
      if (wardId) params.set("ward_id", wardId)
      if (severityFilter !== "All") params.set("severity", severityFilter)

      const data = await apiGet<PaginatedAlarms>(`/proxy/alarms?${params}`)
      setAlarms(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to load alarm history:", err)
      setAlarms([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [timeFilter, severityFilter, page, wardId])

  useEffect(() => {
    if (open) fetchAlarms()
  }, [open, fetchAlarms])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const { label: dateRangeLabel } = getTimeRange(timeFilter)

  const { criticalCount, warningCount } = useMemo(() => ({
    criticalCount: alarms.filter((a) => a.severity === "CRITICAL").length,
    warningCount: alarms.filter((a) => a.severity === "HIGH").length,
  }), [alarms])

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
      <DialogContent className="sm:max-w-[1024px] w-full p-0 gap-0 overflow-hidden" showCloseButton={true}>
        <DialogHeader className="px-8 pt-5 pb-0 gap-0">
          <DialogTitle className="text-[18px] font-semibold text-[#12171c]">Alarm History</DialogTitle>
          <p className="text-[13px] text-[#6b737d] mt-0.5">{stationName}</p>
        </DialogHeader>

        <div className="h-px bg-[#e8ebed] mt-3" />

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-8 py-2.5">
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

          <div className="h-7 flex items-center px-2 rounded-md border border-[#e8ebed] bg-white text-[11px] text-[#38404a] w-[220px]">
            {dateRangeLabel}
          </div>

          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => handleSeverityFilter(e.target.value as SeverityFilter)}
              className="h-7 pl-2 pr-6 rounded-md border border-[#e8ebed] bg-white text-[12px] text-[#38404a] appearance-none cursor-pointer outline-none"
            >
              {SEVERITY_FILTERS.map((f) => (
                <option key={f} value={f}>{f === "All" ? "All" : f}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a1a8b2]">▾</span>
          </div>
        </div>

        <div className="h-px bg-[#e8ebed]" />

        {/* Stats summary */}
        <div className="flex items-center gap-0 px-8 py-2">
          <span className="inline-block size-2 rounded-[2px] bg-[#ef4444] mr-1.5" />
          <span className="text-[12px] font-medium text-[#ef4444] mr-6">Critical: {criticalCount}</span>
          <span className="inline-block size-2 rounded-[2px] bg-[#f97316] mr-1.5" />
          <span className="text-[12px] font-medium text-[#f97316] mr-6">Warning: {warningCount}</span>
          <span className="ml-auto text-[12px] text-[#a1a8b2]">
            Total: {total} alarms in {timeFilter}
          </span>
        </div>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-8 py-8 text-center text-muted-foreground text-[13px]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : alarms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-8 py-8 text-center text-muted-foreground text-[13px]">
                    No alarms found
                  </TableCell>
                </TableRow>
              ) : (
                alarms.map((alarm, idx) => (
                  <TableRow
                    key={alarm.id}
                    className={cn(
                      "border-b border-[#f2f2f5]",
                      idx % 2 === 0 ? "bg-white" : "bg-[#fafafc]"
                    )}
                  >
                    <TableCell className="px-8 py-2.5">
                      <Badge className={severityBadgeClass[alarm.severity] ?? severityBadgeClass.LOW}>
                        {alarm.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[12px] text-[#38404a]">{alarm.bed_label}</TableCell>
                    <TableCell className="px-4 py-2.5 text-[12px] text-[#12171c]">{alarm.patient_name}</TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className={cn("text-[12px] font-medium", paramColorBySeverity[alarm.severity] ?? "text-[#38404a]")}>
                        {alarm.param}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[12px] font-bold text-[#38404a]">
                      {formatValue(alarm)} ({alarm.threshold})
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[11px] text-[#a1a8b2]">{formatTime(alarm.triggered_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="h-px bg-[#e8ebed]" />

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-8 py-3">
          <span className="text-[12px] text-[#a1a8b2]">
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total} alarms`
              : "No alarms"
            }
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

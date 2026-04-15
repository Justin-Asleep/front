"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { PaginationBar } from "@/components/ui/pagination-bar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { apiGet } from "@/services/api"
import { parseIsoAsUtc } from "@/helpers/format-date"
import { toast } from "sonner"

interface DeviceLog {
  id: string
  tablet_id: string
  serial_number: string
  bed_label: string | null
  event_type: string
  status: string
  device_status: Record<string, unknown> | null
  created_at: string
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

interface TabletOption {
  id: string
  serial_number: string
  bed_label: string | null
}

const eventTypeBadgeClass: Record<string, string> = {
  HEARTBEAT:  "bg-[#dcfce7] text-[#16a34a] border-0",
  LOGIN:      "bg-[#eff6ff] text-[#2563eb] border-0",
  ERROR:      "bg-[#feeded] text-[#da3535] border-0",
  DISCONNECT: "bg-[#fff4ea] text-[#f4801e] border-0",
}

const statusBadgeClass: Record<string, string> = {
  SUCCESS: "bg-[#dcfce7] text-[#16a34a] border-0",
  WARNING: "bg-[#fff4ea] text-[#f4801e] border-0",
  FAILED:  "bg-[#feeded] text-[#da3535] border-0",
}

const PAGE_SIZE = 10

export function DeviceLogClient() {
  const [logs, setLogs] = useState<DeviceLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const [tablets, setTablets] = useState<TabletOption[]>([])
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [selectedTablet, setSelectedTablet] = useState("")
  const [selectedEvent, setSelectedEvent] = useState("")

  // Load tablets + event types on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const [tabletsData, eventTypesData] = await Promise.all([
          apiGet<PaginatedData<TabletOption>>("/proxy/tablets?page=1&size=100"),
          apiGet<string[]>("/proxy/tablet-logs/event-types"),
        ])
        setTablets(tabletsData.items)
        setEventTypes(eventTypesData)
      } catch {
        console.error("Failed to load filters")
      }
    }
    loadFilters()
  }, [])

  const fetchLogs = useCallback(async (page: number, tabletId: string, eventType: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })
      if (tabletId) params.set("tablet_id", tabletId)
      if (eventType) params.set("event_type", eventType)
      const data = await apiGet<PaginatedData<DeviceLog>>(`/proxy/tablet-logs?${params}`)
      setLogs(data.items)
      setTotal(data.total)
    } catch {
      toast.error("Failed to load device logs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(currentPage, selectedTablet, selectedEvent)
  }, [currentPage, selectedTablet, selectedEvent, fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleTabletChange(value: string) {
    setSelectedTablet(value)
    setCurrentPage(1)
  }

  function handleEventChange(event: string) {
    setSelectedEvent(event === selectedEvent ? "" : event)
    setCurrentPage(1)
  }

  function formatTimestamp(iso: string) {
    // parseIsoAsUtc로 Z 없는 naive 포맷도 UTC로 간주. toLocaleString은 timeZone 옵션
    // 없이 브라우저 로컬 timezone을 자동 사용.
    const d = parseIsoAsUtc(iso)
    return d.toLocaleString("en-US", {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    })
  }

  function formatDetails(log: DeviceLog): string {
    if (!log.device_status) return "-"
    const ds = log.device_status as Record<string, Record<string, unknown>>
    const parts: string[] = []
    if (ds.tablet) {
      const battery = ds.tablet.battery_level
      if (battery !== undefined) parts.push(`Battery ${battery}%`)
    }
    for (const sensor of ["ecg", "spo2", "temp"]) {
      const s = ds[sensor] as Record<string, unknown> | undefined
      if (s) {
        if (s.connected === false) parts.push(`${sensor.toUpperCase()} disconnected`)
        else if (s.connected === true) parts.push(`${sensor.toUpperCase()} OK`)
      }
    }
    return parts.length > 0 ? parts.join(", ") : "-"
  }

  // Device select options: serial (bed_label)
  const deviceOptions = useMemo(() => [
    { value: "", label: "All Devices" },
    ...tablets.map((t) => ({
      value: t.id,
      label: t.bed_label
        ? `${t.serial_number} (${t.bed_label})`
        : `${t.serial_number} (Unassigned)`,
    })),
  ], [tablets])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Device Log</h1>
        <p className="text-sm text-[#4b5563]">Audit trail of device events and heartbeat activity</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-[280px]">
          <SearchableSelect
            value={selectedTablet}
            onValueChange={handleTabletChange}
            options={deviceOptions}
            placeholder="All Devices"
            className="h-9 border-[#d1d5db] text-[13px]"
          />
        </div>

        <div className="flex gap-2">
          {["All", ...eventTypes].map((event) => {
            const isAll = event === "All"
            const isActive = isAll ? selectedEvent === "" : selectedEvent === event
            return (
              <button
                key={event}
                onClick={() => handleEventChange(isAll ? "" : event)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? "bg-[#2563eb] text-white"
                    : "bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]"
                )}
              >
                {isAll ? "All" : event.charAt(0) + event.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Log Table */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Timestamp</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Device</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Event Type</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-[#9ca3af]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-[#9ca3af]">
                    No log entries found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#fcfcfe]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-6 py-3 text-xs text-[#4b5563]">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div>
                        <span className="font-medium text-[13px] text-[#111827]">{log.serial_number}</span>
                        {log.bed_label && (
                          <span className="text-[11px] text-[#9ca3af] ml-1.5">({log.bed_label})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={eventTypeBadgeClass[log.event_type] ?? "bg-[#f3f4f6] text-[#4b5563] border-0"}>
                        {log.event_type.charAt(0) + log.event_type.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[log.status] ?? "bg-[#f3f4f6] text-[#4b5563] border-0"}>
                        {log.status.charAt(0) + log.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#4b5563]">
                      {formatDetails(log)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="entries"
          />
        </CardContent>
      </Card>
    </div>
  )
}

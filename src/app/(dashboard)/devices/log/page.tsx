"use client"

import { useState, useMemo } from "react"
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
import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"

type EventType = "Heartbeat" | "Error" | "Login" | "Disconnect"
type LogStatus = "Success" | "Warning" | "Failed"

type DeviceLog = {
  id: string
  timestamp: string
  device: string
  eventType: EventType
  status: LogStatus
  details: string
}

const mockLogs: DeviceLog[] = [
  { id: "1",  timestamp: "14:32:01", device: "TAB-001", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 87%" },
  { id: "2",  timestamp: "14:31:45", device: "TAB-003", eventType: "Error",      status: "Warning", details: "Temp sensor disconnected" },
  { id: "3",  timestamp: "14:30:12", device: "TAB-005", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 62%" },
  { id: "4",  timestamp: "14:28:55", device: "TAB-007", eventType: "Login",      status: "Success", details: "Token issued, bed assigned" },
  { id: "5",  timestamp: "14:25:33", device: "TAB-004", eventType: "Disconnect", status: "Failed",  details: "No response after 3 retries" },
  { id: "6",  timestamp: "14:22:10", device: "TAB-002", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 91%" },
  { id: "7",  timestamp: "14:18:47", device: "TAB-006", eventType: "Error",      status: "Failed",  details: "Auth token expired" },
  { id: "8",  timestamp: "14:15:02", device: "TAB-009", eventType: "Login",      status: "Success", details: "Token issued, bed assigned" },
  { id: "9",  timestamp: "14:10:29", device: "TAB-011", eventType: "Disconnect", status: "Warning", details: "SpO2 signal lost" },
  { id: "10", timestamp: "14:05:18", device: "TAB-001", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 88%" },
  { id: "11", timestamp: "13:58:44", device: "TAB-003", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 74%" },
  { id: "12", timestamp: "13:52:11", device: "TAB-005", eventType: "Login",      status: "Success", details: "Token issued, bed assigned" },
  { id: "13", timestamp: "13:45:30", device: "TAB-002", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 93%" },
  { id: "14", timestamp: "13:40:05", device: "TAB-009", eventType: "Error",      status: "Warning", details: "BP sensor intermittent" },
  { id: "15", timestamp: "13:35:22", device: "TAB-007", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 55%" },
  { id: "16", timestamp: "13:30:18", device: "TAB-004", eventType: "Error",      status: "Failed",  details: "Connection timeout" },
  { id: "17", timestamp: "13:25:44", device: "TAB-011", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 81%" },
  { id: "18", timestamp: "13:20:10", device: "TAB-006", eventType: "Disconnect", status: "Failed",  details: "Network unreachable" },
  { id: "19", timestamp: "13:15:33", device: "TAB-001", eventType: "Heartbeat",  status: "Success", details: "All sensors OK, battery 89%" },
  { id: "20", timestamp: "13:10:05", device: "TAB-002", eventType: "Login",      status: "Success", details: "Token issued, bed assigned" },
]

const EVENT_FILTERS = ["All", "Heartbeat", "Login", "Error"] as const
const PAGE_SIZE = 10

const eventTypeBadgeClass: Record<EventType, string> = {
  Heartbeat:  "bg-[#dcfce7] text-[#16a34a] border-0",
  Login:      "bg-[#eff6ff] text-[#2563eb] border-0",
  Error:      "bg-[#feeded] text-[#da3535] border-0",
  Disconnect: "bg-[#fff4ea] text-[#f4801e] border-0",
}

const statusBadgeClass: Record<LogStatus, string> = {
  Success: "bg-[#dcfce7] text-[#16a34a] border-0",
  Warning: "bg-[#fff4ea] text-[#f4801e] border-0",
  Failed:  "bg-[#feeded] text-[#da3535] border-0",
}

const DEVICES = ["All Devices", "TAB-001", "TAB-002", "TAB-003", "TAB-004", "TAB-005", "TAB-006", "TAB-007", "TAB-009", "TAB-011"]

export default function DeviceLogPage() {
  const [selectedDevice, setSelectedDevice] = useState("All Devices")
  const [selectedEvent, setSelectedEvent] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesDevice = selectedDevice === "All Devices" || log.device === selectedDevice
      const matchesEvent = selectedEvent === "All" || log.eventType === selectedEvent
      return matchesDevice && matchesEvent
    })
  }, [selectedDevice, selectedEvent])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)
  const totalEntries = filtered.length

  function handleEventChange(event: string) {
    setSelectedEvent(event)
    setCurrentPage(1)
  }

  function handleDeviceChange(device: string) {
    setSelectedDevice(device)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Device Log</h1>
        <p className="text-sm text-[#4b5563]">Audit trail of device events and heartbeat activity</p>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="px-3 py-2 flex items-center gap-3">
          {/* Device Select */}
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="h-8 px-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] text-xs text-[#4b5563] w-[200px]"
          >
            {DEVICES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="h-8 px-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#4b5563] flex items-center w-[160px]">
            From: 2026-03-20
          </div>
          <div className="h-8 px-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] text-[11px] text-[#4b5563] flex items-center w-[160px]">
            To: 2026-03-27
          </div>

          {/* Event Type Filters */}
          <div className="flex gap-1.5">
            {EVENT_FILTERS.map((event) => (
              <button
                key={event}
                onClick={() => handleEventChange(event)}
                className={cn(
                  "px-2 py-1 rounded-full text-[11px] font-medium transition-colors",
                  selectedEvent === event
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#f9fafb] border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
                )}
              >
                {event}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Export */}
          <Button variant="outline" size="sm" className="h-8 text-[11px] font-medium text-[#4b5563] border-[#d1d5db]">
            Export CSV
          </Button>
        </CardContent>
      </Card>

      {/* Log Table */}
      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
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
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-[#9ca3af]">
                    No log entries found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#fcfcfe]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-6 py-3 text-xs text-[#4b5563]">{log.timestamp}</TableCell>
                    <TableCell className="px-4 py-3 font-medium text-[13px] text-[#111827]">{log.device}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={eventTypeBadgeClass[log.eventType]}>{log.eventType}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[log.status]}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-[#4b5563]">{log.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalEntries}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="entries"
          />
        </CardContent>
      </Card>
    </div>
  )
}

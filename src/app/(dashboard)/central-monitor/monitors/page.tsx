"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type MonitorStatus = "Active" | "Inactive"

type Monitor = {
  id: string
  name: string
  hospital: string
  urlKey: string
  beds: number
  status: MonitorStatus
}

const mockMonitors: Monitor[] = [
  { id: "1", name: "Monitor A", hospital: "Seoul General Hospital", urlKey: "mon_a1b2c3d4e5f6g7h8", beds: 6, status: "Active" },
  { id: "2", name: "Monitor B", hospital: "Seoul General Hospital", urlKey: "mon_b2c3d4e5f6g7h8i9", beds: 4, status: "Active" },
  { id: "3", name: "Monitor C", hospital: "Busan Medical Center",   urlKey: "mon_c3d4e5f6g7h8i9j0", beds: 8, status: "Active" },
  { id: "4", name: "Monitor D", hospital: "Incheon St. Mary's",     urlKey: "mon_d4e5f6g7h8i9j0k1", beds: 6, status: "Inactive" },
  { id: "5", name: "Monitor E", hospital: "Daegu University Hosp",  urlKey: "mon_e5f6g7h8i9j0k1l2", beds: 4, status: "Active" },
]

const statusBadgeClass: Record<MonitorStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function MonitorsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Monitor Management</h1>
          <p className="text-sm text-[#4b5563]">Manage central monitors and their URL keys</p>
        </div>
        <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
          + Add Monitor
        </Button>
      </div>

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Hospital</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Beds</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMonitors.map((monitor, idx) => (
                <TableRow
                  key={monitor.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{monitor.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{monitor.hospital}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="bg-[#f9fafb] rounded-[6px] flex items-center justify-between px-2.5 h-7 w-[240px]">
                      <span className="text-xs text-[#374151] truncate max-w-[160px]">{monitor.urlKey}</span>
                      <button
                        onClick={() => handleCopy(monitor.id, monitor.urlKey)}
                        className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium ml-2 shrink-0"
                      >
                        {copiedId === monitor.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{monitor.beds} beds</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={statusBadgeClass[monitor.status]}>{monitor.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8 text-[#2563eb] hover:text-[#1d4ed8]">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-[#dc2626] hover:text-[#b91c1c]">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

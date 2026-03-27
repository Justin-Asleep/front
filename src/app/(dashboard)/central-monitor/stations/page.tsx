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
import { cn } from "@/lib/utils"

type StationStatus = "Active" | "Inactive"

type Station = {
  id: string
  name: string
  hospital: string
  ward: string
  urlKey: string
  status: StationStatus
}

const mockStations: Station[] = [
  { id: "1", name: "Station Alpha", hospital: "Seoul General Hospital", ward: "Internal Medicine", urlKey: "sta_a1b2c3d4e5f6g7h8", status: "Active" },
  { id: "2", name: "Station Beta",  hospital: "Seoul General Hospital", ward: "Surgery",           urlKey: "sta_b2c3d4e5f6g7h8i9", status: "Active" },
  { id: "3", name: "Station Gamma", hospital: "Busan Medical Center",   ward: "ICU",               urlKey: "sta_c3d4e5f6g7h8i9j0", status: "Active" },
  { id: "4", name: "Station Delta", hospital: "Incheon St. Mary's",     ward: "Pediatrics",        urlKey: "sta_d4e5f6g7h8i9j0k1", status: "Inactive" },
]

const statusBadgeClass: Record<StationStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function StationsPage() {
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
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Station Management</h1>
          <p className="text-sm text-[#4b5563]">Manage nursing stations and their URL keys</p>
        </div>
        <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
          + Add Station
        </Button>
      </div>

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Hospital</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ward</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStations.map((station, idx) => (
                <TableRow
                  key={station.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{station.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{station.hospital}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{station.ward}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="bg-[#f9fafb] rounded-[6px] flex items-center justify-between px-2.5 h-7 w-[220px]">
                      <span className="text-xs text-[#374151] truncate max-w-[140px]">{station.urlKey}</span>
                      <button
                        onClick={() => handleCopy(station.id, station.urlKey)}
                        className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium ml-2 shrink-0"
                      >
                        {copiedId === station.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={statusBadgeClass[station.status]}>{station.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button variant="ghost" className="h-8 px-3 text-sm text-[#2563eb] hover:text-[#1d4ed8]">
                      Edit
                    </Button>
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

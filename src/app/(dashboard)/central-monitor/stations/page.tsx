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
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddStationModal } from "@/components/central-monitor/add-station-modal"
import { EditStationModal } from "@/components/central-monitor/edit-station-modal"

type StationStatus = "Active" | "Inactive"

type Station = {
  id: string
  name: string
  hospital: string
  ward: string
  urlKey: string
  status: StationStatus
}

const initialStations: Station[] = [
  { id: "1", name: "Internal Med Station", hospital: "Seoul General", ward: "internal-medicine", urlKey: "c4d2e891-1b7f-4a3c-8d9e-5f6a7b8c9d1b", status: "Active" },
  { id: "2", name: "Surgery Station",      hospital: "Seoul General", ward: "surgery",           urlKey: "a9f1b374-8e2c-4d5a-6b7c-8d9e0f1a2b8e", status: "Active" },
  { id: "3", name: "ICU Station",          hospital: "Yonsei Med",    ward: "icu",               urlKey: "e7c3d628-4a5d-4b6c-9e0f-1a2b3c4d5e4a", status: "Active" },
  { id: "4", name: "ER Station",           hospital: "Asan Med",      ward: "emergency",         urlKey: "b1a4f952-e6c3-4d7b-8f2a-6c3d4e5f6a7b", status: "Inactive" },
]

const WARD_LABELS: Record<string, string> = {
  "internal-medicine": "Internal Medicine",
  "surgery": "Surgery",
  "icu": "ICU",
  "emergency": "Emergency",
  "pediatrics": "Pediatrics",
}

const statusBadgeClass: Record<StationStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>(initialStations)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Station | null>(null)

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleAdd(data: { name: string; ward: string }) {
    const newStation: Station = {
      id: String(Date.now()),
      name: data.name,
      hospital: "Seoul General",
      ward: data.ward,
      urlKey: crypto.randomUUID(),
      status: "Active",
    }
    setStations((prev) => [...prev, newStation])
  }

  function handleEdit(data: { name: string; ward: string; status: StationStatus }) {
    if (!editTarget) return
    setStations((prev) =>
      prev.map((s) =>
        s.id === editTarget.id
          ? { ...s, name: data.name, ward: data.ward, status: data.status }
          : s
      )
    )
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Station Registration</h1>
          <p className="text-sm text-[#4b5563]">Manage nurse station displays</p>
        </div>
        <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white" onClick={() => setAddOpen(true)}>
          + Add Station
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
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
              {stations.map((station, idx) => (
                <TableRow
                  key={station.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{station.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{station.hospital}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{WARD_LABELS[station.ward] ?? station.ward}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="bg-[#f9fafb] rounded-[6px] flex items-center justify-between px-2.5 h-7 w-[220px]">
                      <span className="font-mono text-xs text-[#374151] truncate max-w-[140px]">{station.urlKey}</span>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                      onClick={() => setEditTarget(station)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddStationModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      {editTarget && (
        <EditStationModal
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null) }}
          station={editTarget}
          onSubmit={handleEdit}
        />
      )}
    </div>
  )
}

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
import { AddWardModal } from "@/components/admin/add-ward-modal"
import { EditWardModal } from "@/components/admin/edit-ward-modal"

type WardStatus = "Active" | "Inactive"

type Ward = {
  id: string
  name: string
  floor: string
  rooms: number
  beds: number
  occupancy: number
  status: WardStatus
}

const initialWards: Ward[] = [
  { id: "1", name: "Internal Medicine", floor: "3F", rooms: 8,  beds: 32, occupancy: 75, status: "Active" },
  { id: "2", name: "Surgery",           floor: "4F", rooms: 6,  beds: 24, occupancy: 83, status: "Active" },
  { id: "3", name: "Pediatrics",        floor: "2F", rooms: 5,  beds: 20, occupancy: 60, status: "Active" },
  { id: "4", name: "ICU",               floor: "5F", rooms: 4,  beds: 16, occupancy: 94, status: "Active" },
  { id: "5", name: "Emergency",         floor: "1F", rooms: 3,  beds: 12, occupancy: 67, status: "Active" },
  { id: "6", name: "Rehabilitation",    floor: "6F", rooms: 4,  beds: 16, occupancy: 50, status: "Inactive" },
]

const statusBadgeClass: Record<WardStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

function OccupancyBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "#dc2626" :
    value >= 71 ? "#f59e0b" :
    "#16a34a"

  return (
    <div className="flex items-center gap-2">
      <div className="w-[100px] h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-[#374151]">{value}%</span>
    </div>
  )
}

export default function WardsPage() {
  const [wards, setWards] = useState<Ward[]>(initialWards)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Ward | null>(null)

  function handleAdd(data: { name: string; floor: string }) {
    const newWard: Ward = {
      id: String(Date.now()),
      name: data.name,
      floor: data.floor ? `${data.floor}F` : "—",
      rooms: 0,
      beds: 0,
      occupancy: 0,
      status: "Active",
    }
    setWards((prev) => [...prev, newWard])
  }

  function handleSave(data: { id: string; name: string; floor: string; status: WardStatus }) {
    setWards((prev) =>
      prev.map((w) =>
        w.id === data.id
          ? { ...w, name: data.name, floor: data.floor ? `${data.floor}F` : w.floor, status: data.status }
          : w
      )
    )
  }

  const editTargetForModal = editTarget
    ? { ...editTarget, floor: editTarget.floor.replace("F", "") }
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Ward Management</h1>
          <p className="text-sm text-[#4b5563]">Manage hospital wards and floors</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Ward
        </Button>
      </div>

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ward Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Floor</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Rooms</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Beds</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Occupancy</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wards.map((ward, idx) => (
                <TableRow
                  key={ward.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{ward.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{ward.floor}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{ward.rooms}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{ward.beds}</TableCell>
                  <TableCell className="px-4 py-3">
                    <OccupancyBar value={ward.occupancy} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={statusBadgeClass[ward.status]}>{ward.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="ghost"
                      className="h-8 px-3 text-sm text-[#2563eb] hover:text-[#1d4ed8]"
                      onClick={() => setEditTarget(ward)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddWardModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />

      <EditWardModal
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        ward={editTargetForModal}
        onSave={handleSave}
      />
    </div>
  )
}

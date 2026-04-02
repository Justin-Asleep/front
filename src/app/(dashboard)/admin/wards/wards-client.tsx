"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { AddWardModal } from "@/components/admin/add-ward-modal"
import { EditWardModal } from "@/components/admin/edit-ward-modal"
import { OccupancyBar } from "@/components/ui/occupancy-bar"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { type WardStatus, type Ward } from "@/data/ward-data"
import { statusBadgeClass } from "@/helpers/status-badge"

export function WardsClient({ initialWards }: { initialWards: Ward[] }) {
  const router = useRouter()
  const [wards, setWards] = useState<Ward[]>(initialWards)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Ward | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ward | null>(null)

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

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Ward Name</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Floor</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Rooms</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Beds</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Occupancy</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Status</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Actions</TableHead>
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
                  <TableCell className="px-6 py-3 font-medium text-[#111827]">{ward.name}</TableCell>
                  <TableCell className="px-6 py-3 text-[#4b5563]">{ward.floor}</TableCell>
                  <TableCell className="px-6 py-3 text-[#4b5563]">{ward.rooms}</TableCell>
                  <TableCell className="px-6 py-3 text-[#4b5563]">{ward.beds}</TableCell>
                  <TableCell className="px-6 py-3">
                    <OccupancyBar value={ward.occupancy} />
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <Badge className={statusBadgeClass[ward.status]}>{ward.status}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                        onClick={() => router.push('/admin/wards/' + ward.id)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                        onClick={() => setDeleteTarget(ward)}
                      >
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

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Ward"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={() => {
          if (deleteTarget) {
            setWards((prev) => prev.filter((w) => w.id !== deleteTarget.id))
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}

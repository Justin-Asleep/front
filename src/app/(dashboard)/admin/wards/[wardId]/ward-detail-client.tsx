"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddRoomModal } from "@/components/admin/add-room-modal"
import { EditRoomModal } from "@/components/admin/edit-room-modal"
import { EditWardModal } from "@/components/admin/edit-ward-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { OccupancyBar } from "@/components/ui/occupancy-bar"
import { type WardStatus, type Ward, type RoomType, type Room } from "@/data/ward-data"
import { statusBadgeClass } from "@/helpers/status-badge"

export function WardDetailClient({
  initialWard,
  initialRooms,
}: {
  initialWard: Ward
  initialRooms: Room[]
}) {
  const [ward, setWard] = useState<Ward>(initialWard)
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [addOpen, setAddOpen] = useState(false)
  const [editRoomTarget, setEditRoomTarget] = useState<Room | null>(null)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<Room | null>(null)
  const [editWardOpen, setEditWardOpen] = useState(false)

  function handleAddRoom(data: { ward: string; name: string; type: RoomType; beds: number }) {
    const newRoom: Room = {
      room: data.name,
      ward: data.ward,
      type: data.type,
      beds: data.beds,
      occupied: 0,
      available: data.beds,
      status: "Active",
    }
    setRooms((prev) => [...prev, newRoom])
  }

  function handleSaveRoom(data: Room) {
    setRooms((prev) => prev.map((r) => r.room === editRoomTarget?.room ? data : r))
    setEditRoomTarget(null)
  }

  function handleDeleteRoom() {
    if (!deleteRoomTarget) return
    setRooms((prev) => prev.filter((r) => r.room !== deleteRoomTarget.room))
    setDeleteRoomTarget(null)
  }

  function handleSaveWard(data: { id: string; name: string; floor: string; status: WardStatus }) {
    setWard((prev) => ({
      ...prev,
      name: data.name,
      floor: data.floor ? `${data.floor}F` : prev.floor,
      status: data.status,
    }))
  }

  const editWardForModal = ward
    ? { ...ward, floor: ward.floor.replace("F", "") }
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/wards"
          className="inline-flex items-center text-sm text-[#2563eb] hover:text-[#1d4ed8] mb-3"
        >
          ← Back to Wards
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">{ward.name}</h1>
            <p className="text-sm text-[#4b5563]">Ward Management &gt; {ward.name}</p>
          </div>
          <Button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
            onClick={() => setEditWardOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Floor</span>
              <span className="text-[15px] font-semibold text-[#111827]">{ward.floor}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Rooms</span>
              <span className="text-[15px] font-semibold text-[#111827]">{rooms.length}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Beds</span>
              <span className="text-[15px] font-semibold text-[#111827]">{ward.beds}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Occupancy</span>
              <OccupancyBar value={ward.occupancy} />
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Status</span>
              <Badge className={statusBadgeClass[ward.status]}>{ward.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Rooms ({rooms.length})</h2>
          <Button
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
            onClick={() => setAddOpen(true)}
          >
            + Add Room
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div
              key={room.room}
              className={`bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm flex flex-col gap-3 ${
                room.status === "Inactive" ? "opacity-60" : ""
              }`}
            >
              <div>
                <p className="font-semibold text-[#111827]">{room.room}</p>
                <p className="text-sm text-[#9ca3af] mt-0.5">
                  {room.type} · {room.beds} beds
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#4b5563]">
                  {room.occupied}/{room.beds} occupied
                </span>
                <span className="text-[12px] font-medium text-[#2563eb]"
                  style={{ opacity: 0.4 + (room.occupied / room.beds) * 0.6 }}
                >
                  {room.available} available
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-[13px] border-[#d1d5db] text-[#4b5563]"
                  onClick={() => setEditRoomTarget(room)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-[13px] border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                  onClick={() => setDeleteRoomTarget(room)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddRoomModal
        open={addOpen}
        onOpenChange={setAddOpen}
        ward={ward.name}
        onAdd={handleAddRoom}
      />

      <EditRoomModal
        open={editRoomTarget !== null}
        onOpenChange={(open) => { if (!open) setEditRoomTarget(null) }}
        room={editRoomTarget}
        onSave={handleSaveRoom}
      />

      <ConfirmDeleteDialog
        open={deleteRoomTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteRoomTarget(null) }}
        title="Delete Room"
        targetName={deleteRoomTarget?.room ?? ""}
        onConfirm={handleDeleteRoom}
      />

      <EditWardModal
        open={editWardOpen}
        onOpenChange={setEditWardOpen}
        ward={editWardForModal}
        onSave={handleSaveWard}
      />
    </div>
  )
}

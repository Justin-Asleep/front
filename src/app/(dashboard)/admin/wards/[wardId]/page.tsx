"use client"

import { use, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddRoomModal } from "@/components/admin/add-room-modal"
import { EditRoomModal } from "@/components/admin/edit-room-modal"
import { EditWardModal } from "@/components/admin/edit-ward-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { OccupancyBar } from "@/components/ui/occupancy-bar"

type WardStatus = "Active" | "Inactive"
type RoomType = "SINGLE" | "QUAD" | "HEX"

type Ward = {
  id: string
  name: string
  floor: string
  rooms: number
  beds: number
  occupancy: number
  status: WardStatus
}

type Room = {
  room: string
  ward: string
  type: RoomType
  beds: number
  occupied: number
  available: number
  status: "Active" | "Inactive"
}

const initialWards: Ward[] = [
  { id: "1", name: "Internal Medicine", floor: "3F", rooms: 8,  beds: 32, occupancy: 75, status: "Active" },
  { id: "2", name: "Surgery",           floor: "4F", rooms: 6,  beds: 24, occupancy: 83, status: "Active" },
  { id: "3", name: "Pediatrics",        floor: "2F", rooms: 5,  beds: 20, occupancy: 60, status: "Active" },
  { id: "4", name: "ICU",               floor: "5F", rooms: 4,  beds: 16, occupancy: 94, status: "Active" },
  { id: "5", name: "Emergency",         floor: "1F", rooms: 3,  beds: 12, occupancy: 67, status: "Active" },
  { id: "6", name: "Rehabilitation",    floor: "6F", rooms: 4,  beds: 16, occupancy: 50, status: "Inactive" },
]

const allRooms: Room[] = [
  { room: "Room 301", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 302", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 303", ward: "Internal Medicine", type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 304", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 5, available: 1, status: "Active" },
  { room: "Room 305", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 306", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 307", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Inactive" },
  { room: "Room 308", ward: "Internal Medicine", type: "SINGLE", beds: 1, occupied: 0, available: 1, status: "Active" },
  { room: "Room 401", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 402", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 403", ward: "Surgery",           type: "HEX",    beds: 6, occupied: 6, available: 0, status: "Active" },
  { room: "Room 404", ward: "Surgery",           type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 405", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 406", ward: "Surgery",           type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 201", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 202", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 203", ward: "Pediatrics",        type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Active" },
  { room: "Room 204", ward: "Pediatrics",        type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 205", ward: "Pediatrics",        type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 501", ward: "ICU",               type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 502", ward: "ICU",               type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 503", ward: "ICU",               type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 504", ward: "ICU",               type: "HEX",    beds: 6, occupied: 6, available: 0, status: "Active" },
  { room: "Room 101", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 102", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 3, available: 1, status: "Active" },
  { room: "Room 103", ward: "Emergency",         type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 601", ward: "Rehabilitation",    type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 602", ward: "Rehabilitation",    type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 603", ward: "Rehabilitation",    type: "HEX",    beds: 6, occupied: 3, available: 3, status: "Active" },
  { room: "Room 604", ward: "Rehabilitation",    type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Inactive" },
]

const statusBadgeClass: Record<WardStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}


export default function WardDetailPage({
  params,
}: {
  params: Promise<{ wardId: string }>
}) {
  const { wardId } = use(params)
  const foundWard = initialWards.find((w) => w.id === wardId)
  if (!foundWard) notFound()

  const wardRooms = allRooms.filter((r) => r.ward === foundWard.name)

  const [ward, setWard] = useState<Ward>(foundWard)
  const [rooms, setRooms] = useState<Room[]>(wardRooms)
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

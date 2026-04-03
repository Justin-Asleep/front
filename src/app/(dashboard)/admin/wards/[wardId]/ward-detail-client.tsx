"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddRoomModal } from "@/components/admin/add-room-modal"
import { EditRoomModal } from "@/components/admin/edit-room-modal"
import { EditWardModal } from "@/components/admin/edit-ward-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api"

type RoomType = "SINGLE" | "QUAD" | "HEX"

interface BedDTO {
  id: string
  room_id: string
  bed_number: number
  label: string
  is_active: boolean
}

interface RoomWithBedsDTO {
  id: string
  ward_id: string
  name: string
  room_type: number
  is_active: boolean
  beds: BedDTO[]
}

interface WardDTO {
  id: string
  hospital_id: string
  name: string
  floor: number | null
  is_active: boolean
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

const ROOM_TYPE_LABEL: Record<number, string> = {
  1: "SINGLE",
  4: "QUAD",
  6: "HEX",
}

export function WardDetailClient({ wardId }: { wardId: string }) {
  const [ward, setWard] = useState<WardDTO | null>(null)
  const [rooms, setRooms] = useState<RoomWithBedsDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editWardOpen, setEditWardOpen] = useState(false)
  const [editRoomTarget, setEditRoomTarget] = useState<RoomWithBedsDTO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoomWithBedsDTO | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<PaginatedData<RoomWithBedsDTO>>(
        `/proxy/wards/${wardId}/rooms?page=1&size=100`
      )
      setRooms(data.items)
    } catch (err) {
      setError("Failed to load rooms")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [wardId])

  const fetchWardFromList = useCallback(async () => {
    try {
      const data = await apiGet<PaginatedData<WardDTO>>(`/proxy/wards?page=1&size=100`)
      const found = data.items.find((w) => w.id === wardId)
      if (found) setWard(found)
    } catch (err) {
      console.error("Failed to load ward info:", err)
    }
  }, [wardId])

  useEffect(() => {
    fetchData()
    fetchWardFromList()
  }, [fetchData, fetchWardFromList])

  async function handleAddRoom(data: { ward: string; name: string; type: RoomType; beds: number }) {
    try {
      await apiPost(`/proxy/wards/${wardId}/rooms`, {
        name: data.name,
        room_type: data.beds,
      })
      await fetchData()
    } catch (err) {
      console.error("Failed to create room:", err)
    }
  }

  async function handleSaveWard(data: { id: string; name: string; floor: string; status: "Active" | "Inactive" }) {
    try {
      await apiPatch(`/proxy/wards/${wardId}`, {
        name: data.name,
        floor: data.floor ? Number(data.floor) : null,
        is_active: data.status === "Active",
      })
      await fetchWardFromList()
    } catch (err) {
      console.error("Failed to update ward:", err)
    }
  }

  async function handleSaveRoom(roomData: { room: string; ward: string; type: RoomType; beds: number; occupied: number; available: number; status: "Active" | "Inactive" }) {
    if (!editRoomTarget) return
    const ROOM_TYPE_VALUE: Record<RoomType, number> = { SINGLE: 1, QUAD: 4, HEX: 6 }
    const currentType = editRoomTarget.room_type
    const newType = ROOM_TYPE_VALUE[roomData.type]
    try {
      await apiPatch(`/proxy/wards/rooms/${editRoomTarget.id}`, {
        name: roomData.room,
        is_active: roomData.status === "Active",
        ...(newType !== currentType ? { room_type: newType } : {}),
      })
      setEditRoomTarget(null)
      await fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error_code?: string; message?: string } } }
      if (error.response?.data?.error_code === "ACTIVE_ENCOUNTER_EXISTS") {
        alert(error.response.data.message ?? "Cannot change room type: beds have active encounters")
      } else {
        console.error("Failed to update room:", err)
      }
    }
  }

  async function handleDeleteRoom() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/proxy/wards/rooms/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to delete room:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading rooms...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  const totalBeds = rooms.reduce((sum, r) => sum + r.beds.length, 0)
  const wardName = ward?.name ?? "Ward"
  const wardFloor = ward?.floor ? `${ward.floor}F` : "—"
  const wardIsActive = ward?.is_active ?? true

  const editWardForModal = ward
    ? { id: ward.id, name: ward.name, floor: ward.floor?.toString() ?? "", status: (ward.is_active ? "Active" : "Inactive") as "Active" | "Inactive" }
    : null

  const editRoomForModal = editRoomTarget
    ? {
        room: editRoomTarget.name,
        ward: wardName,
        type: (ROOM_TYPE_LABEL[editRoomTarget.room_type] ?? "QUAD") as RoomType,
        beds: editRoomTarget.beds.length,
        occupied: 0,
        available: editRoomTarget.beds.length,
        status: (editRoomTarget.is_active ? "Active" : "Inactive") as "Active" | "Inactive",
      }
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
            <h1 className="text-2xl font-bold text-[#111827]">{wardName}</h1>
            <p className="text-sm text-[#4b5563]">Ward Management &gt; {wardName}</p>
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
              <span className="text-[15px] font-semibold text-[#111827]">{wardFloor}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Rooms</span>
              <span className="text-[15px] font-semibold text-[#111827]">{rooms.length}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Beds</span>
              <span className="text-[15px] font-semibold text-[#111827]">{totalBeds}</span>
            </div>
            <div className="h-8 w-px bg-[#e5e7eb]" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#9ca3af]">Status</span>
              <Badge className={wardIsActive
                ? "bg-[#dcfce7] text-[#16a34a] border-0"
                : "bg-[#f3f4f6] text-[#6b7280] border-0"
              }>
                {wardIsActive ? "Active" : "Inactive"}
              </Badge>
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

        {rooms.length === 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-8 text-center text-[#9ca3af]">
              No rooms found. Click &quot;+ Add Room&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm flex flex-col gap-3 ${
                  !room.is_active ? "opacity-60" : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-[#111827]">{room.name}</p>
                  <p className="text-sm text-[#9ca3af] mt-0.5">
                    {ROOM_TYPE_LABEL[room.room_type] ?? `${room.room_type}-bed`} · {room.beds.length} beds
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={room.is_active
                    ? "bg-[#dcfce7] text-[#16a34a] border-0"
                    : "bg-[#f3f4f6] text-[#6b7280] border-0"
                  }>
                    {room.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-[13px] text-[#4b5563]">
                    {room.beds.length} beds
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
                    onClick={() => setDeleteTarget(room)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddRoomModal
        open={addOpen}
        onOpenChange={setAddOpen}
        ward={wardName}
        onAdd={handleAddRoom}
      />

      <EditRoomModal
        key={editRoomTarget?.id}
        open={editRoomTarget !== null}
        onOpenChange={(open) => { if (!open) setEditRoomTarget(null) }}
        room={editRoomForModal}
        onSave={handleSaveRoom}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Room"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDeleteRoom}
      />

      <EditWardModal
        key={`${ward?.id}-${ward?.name}-${ward?.is_active}`}
        open={editWardOpen}
        onOpenChange={setEditWardOpen}
        ward={editWardForModal}
        onSave={handleSaveWard}
      />
    </div>
  )
}

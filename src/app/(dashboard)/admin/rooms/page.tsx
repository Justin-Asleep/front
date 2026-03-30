"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddRoomModal } from "@/components/admin/add-room-modal"

type RoomType = "SINGLE" | "QUAD" | "HEX"

type Room = {
  room: string
  ward: string
  type: RoomType
  beds: number
  occupied: number
  available: number
  status: "Active" | "Inactive"
}

const initialRooms: Room[] = [
  { room: "Room 301", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 302", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 4, available: 0, status: "Active" },
  { room: "Room 303", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 4, available: 2, status: "Active" },
  { room: "Room 304", ward: "Internal Medicine", type: "SINGLE", beds: 1, occupied: 1, available: 0, status: "Active" },
  { room: "Room 305", ward: "Internal Medicine", type: "QUAD",   beds: 4, occupied: 2, available: 2, status: "Active" },
  { room: "Room 306", ward: "Internal Medicine", type: "HEX",    beds: 6, occupied: 0, available: 6, status: "Inactive" },
]

const wards = ["Internal Medicine", "Surgery", "Pediatrics", "ICU", "Emergency", "Rehabilitation"]

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [selectedWard, setSelectedWard] = useState("Internal Medicine")
  const [addOpen, setAddOpen] = useState(false)

  const filteredRooms = rooms.filter((r) => r.ward === selectedWard)

  function handleAdd(data: { ward: string; name: string; type: RoomType; beds: number }) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Room Management</h1>
          <p className="text-muted-foreground">Manage rooms and beds within wards</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Room
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4">
            <Select value={selectedWard} onValueChange={(v) => v && setSelectedWard(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward} value={ward}>
                    {ward}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Occupied</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((row, i) => (
                <TableRow key={row.room} className={i % 2 === 1 ? "bg-[#f9fafb]" : ""}>
                  <TableCell className="font-medium text-[#111827]">{row.room}</TableCell>
                  <TableCell className="text-[#4b5563]">
                    {row.type} ({row.beds})
                  </TableCell>
                  <TableCell>{row.beds}</TableCell>
                  <TableCell>
                    <span className={row.available === 0 ? "text-[#dc2626] font-medium" : "text-[#111827] font-medium"}>
                      {row.occupied}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.available === 0 ? "text-[#dc2626]" : "text-[#16a34a] font-medium"}>
                      {row.available}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.status === "Active" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#9ca3af]">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button className="text-[#2563eb] font-medium text-sm hover:underline">
                      View Beds
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddRoomModal
        open={addOpen}
        onOpenChange={setAddOpen}
        ward={selectedWard}
        onAdd={handleAdd}
      />
    </div>
  )
}

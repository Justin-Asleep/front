"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type RoomType = "SINGLE" | "QUAD" | "HEX"

const ROOM_TYPE_BEDS: Record<RoomType, number> = {
  SINGLE: 1,
  QUAD: 4,
  HEX: 6,
}

interface RoomData {
  room: string
  ward: string
  type: RoomType
  beds: number
  occupied: number
  available: number
  status: "Active" | "Inactive"
}

interface EditRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: RoomData | null
  onSave: (data: RoomData) => void
}

export function EditRoomModal({ open, onOpenChange, room, onSave }: EditRoomModalProps) {
  const [name, setName] = useState(room?.room ?? "")
  const [roomType, setRoomType] = useState<RoomType>(room?.type ?? "QUAD")
  const [active, setActive] = useState(room?.status !== "Inactive")

  function handleSubmit() {
    if (!room || !name) return
    const newBeds = ROOM_TYPE_BEDS[roomType]
    const occupied = Math.min(room.occupied, newBeds)
    onSave({
      ...room,
      room: name,
      type: roomType,
      beds: newBeds,
      occupied,
      available: newBeds - occupied,
      status: active ? "Active" : "Inactive",
    })
    onOpenChange(false)
  }

  function handleCancel() {
    onOpenChange(false)
  }

  return (
    <Dialog key={room?.room} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Edit Room
              </DialogTitle>
              <p className="text-[14px] text-[#9ca3af] mt-1">Update room information</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] text-[16px] leading-none hover:text-[#6b7280] mt-0.5"
            >
              x
            </button>
          </div>
        </DialogHeader>

        <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

        <div className="px-8 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#9ca3af]">Ward</label>
            <div className="h-10 px-3.5 flex items-center rounded-lg bg-[#f9fafb] text-[14px] text-[#4b5563]">
              {room?.ward}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Room Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Room Type *</label>
            <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)}>
              <SelectTrigger className="w-full h-10 border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">SINGLE (1 bed)</SelectItem>
                <SelectItem value="QUAD">QUAD (4 beds)</SelectItem>
                <SelectItem value="HEX">HEX (6 beds)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#111827]">Status</label>
            <div className="flex items-center gap-3">
              <Switch
                checked={active}
                onCheckedChange={(checked) => setActive(checked)}
                aria-label="Status toggle"
                className="data-checked:bg-[#16a34a]"
              />
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium",
                  active
                    ? "bg-[#dcfce7] text-[#16a34a]"
                    : "bg-[#f3f4f6] text-[#9ca3af]"
                )}
              >
                {active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#e5e7eb] mx-8" />

        <div className="px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] text-[14px] font-medium rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name}
            className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

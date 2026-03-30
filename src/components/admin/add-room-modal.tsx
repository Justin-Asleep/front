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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RoomType = "SINGLE" | "QUAD" | "HEX"

const ROOM_TYPE_BEDS: Record<RoomType, number> = {
  SINGLE: 1,
  QUAD: 4,
  HEX: 6,
}

interface AddRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ward: string
  onAdd: (data: { ward: string; name: string; type: RoomType; beds: number }) => void
}

export function AddRoomModal({ open, onOpenChange, ward, onAdd }: AddRoomModalProps) {
  const [name, setName] = useState("")
  const [roomType, setRoomType] = useState<RoomType | "">("")

  function handleSubmit() {
    if (!name || !roomType) return
    onAdd({ ward, name, type: roomType, beds: ROOM_TYPE_BEDS[roomType] })
    onOpenChange(false)
    setName("")
    setRoomType("")
  }

  function handleCancel() {
    onOpenChange(false)
    setName("")
    setRoomType("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Add New Room
              </DialogTitle>
              <p className="text-[14px] text-[#9ca3af] mt-1">Create a new room in the selected ward</p>
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

        {/* Form */}
        <div className="px-8 py-5 space-y-5">
          {/* Ward — read-only */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#9ca3af]">Ward</label>
            <div className="h-10 px-3.5 flex items-center rounded-lg bg-[#f9fafb] text-[14px] text-[#4b5563]">
              {ward}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Room Name *</label>
            <Input
              placeholder="e.g. Room 307"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Room Type *</label>
            <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)}>
              <SelectTrigger className="w-full h-10 border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue placeholder="Select room type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">SINGLE (1 bed)</SelectItem>
                <SelectItem value="QUAD">QUAD (4 beds)</SelectItem>
                <SelectItem value="HEX">HEX (6 beds)</SelectItem>
              </SelectContent>
            </Select>

            {/* Info box */}
            <div className="flex items-start gap-2 bg-[#eff6ff] rounded-lg px-3 py-2.5 mt-2">
              <div className="mt-0.5 size-2 rounded-full bg-[#2563eb] shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-[#2563eb]">
                  SINGLE = 1 bed&nbsp;&nbsp;|&nbsp;&nbsp;QUAD = 4 beds&nbsp;&nbsp;|&nbsp;&nbsp;HEX = 6 beds
                </p>
                <p className="text-[11px] text-[#4b82f6]">
                  Beds are auto-generated based on room type.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#e5e7eb] mx-8" />

        {/* Footer */}
        <div className="px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 px-6 border-[#d1d5db] text-[#4b5563] text-[14px] font-medium rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !roomType}
            className="h-10 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
          >
            Add Room
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

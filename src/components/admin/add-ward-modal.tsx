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

interface AddWardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: { name: string; floor: string }) => void
}

export function AddWardModal({ open, onOpenChange, onAdd }: AddWardModalProps) {
  const [name, setName] = useState("")
  const [floor, setFloor] = useState("")

  function handleSubmit() {
    if (!name) return
    onAdd({ name, floor })
    onOpenChange(false)
    setName("")
    setFloor("")
  }

  function handleCancel() {
    onOpenChange(false)
    setName("")
    setFloor("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[480px] max-w-[480px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Add New Ward
              </DialogTitle>
              <p className="text-[14px] text-[#9ca3af] mt-1">Create a new ward in the hospital</p>
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
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Ward Name *</label>
            <Input
              placeholder="e.g. Internal Medicine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Floor</label>
            <Input
              placeholder="e.g. 3"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
            <p className="text-[12px] text-[#9ca3af]">Optional — floor number for the ward</p>
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
            disabled={!name}
            className="h-10 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
          >
            Add Ward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

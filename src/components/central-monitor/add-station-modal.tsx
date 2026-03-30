"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const WARD_OPTIONS = [
  { value: "internal-medicine", label: "Internal Medicine" },
  { value: "surgery", label: "Surgery" },
  { value: "icu", label: "ICU" },
  { value: "emergency", label: "Emergency" },
  { value: "pediatrics", label: "Pediatrics" },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: { name: string; ward: string }) => void
}

export function AddStationModal({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [ward, setWard] = useState("")

  function handleSubmit() {
    if (!name.trim() || !ward) return
    onSubmit?.({ name: name.trim(), ward })
    setName("")
    setWard("")
    onOpenChange(false)
  }

  function handleCancel() {
    setName("")
    setWard("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] p-0 rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-[18px] font-semibold text-[#12171c]">
                Add New Station
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#6b737d] mt-1">
                Create a nurse station display
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={handleCancel}
              className="text-[#a1a8b2] hover:text-[#6b737d] text-[18px] leading-none mt-0.5"
            >
              ✕
            </button>
          </div>
          <div className="mt-5 h-px bg-[#e8ebed]" />
        </div>

        {/* Body */}
        <div className="px-8 pt-5 pb-0 flex flex-col gap-5">
          {/* Station Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#6b737d]">
              Station Name <span className="text-[#2563eb]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICU Station"
              className="h-10 rounded-lg border-[#d6d9db] text-[14px]"
            />
          </div>

          {/* Ward */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#6b737d]">
              Ward <span className="text-[#2563eb]">*</span>
            </label>
            <Select value={ward} onValueChange={(val) => { if (val) setWard(val) }}>
              <SelectTrigger className="h-10 w-full rounded-lg border-[#d6d9db] text-[14px] text-[#38404a]">
                <SelectValue placeholder="Select ward..." />
              </SelectTrigger>
              <SelectContent>
                {WARD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info banner — 2 lines */}
          <div className="flex items-start gap-2 bg-[#f0f2fc] rounded-lg px-3 py-3">
            <span className="size-2 rounded-full bg-[#2563eb] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#2563eb]">
                URL Key will be auto-generated upon creation.
              </span>
              <span className="text-[12px] text-[#597ad9]">
                Station monitors all beds in the selected ward.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 pt-5">
          <div className="h-px bg-[#e8ebed] mb-5" />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-10 w-[100px] border-[#e8ebed] text-[#38404a] text-[14px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !ward}
              className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-medium"
            >
              Add Station
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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

const LAYOUT_OPTIONS = [
  { value: "2x2", label: "2 × 2 (4 beds)" },
  { value: "2x3", label: "2 × 3 (6 beds)" },
  { value: "4x2", label: "4 × 2 (8 beds)" },
  { value: "4x3", label: "4 × 3 (12 beds)" },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: { name: string; layout: string }) => void
}

export function AddMonitorModal({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [layout, setLayout] = useState("")

  function handleSubmit() {
    if (!name.trim() || !layout) return
    onSubmit?.({ name: name.trim(), layout })
    setName("")
    setLayout("")
    onOpenChange(false)
  }

  function handleCancel() {
    setName("")
    setLayout("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] p-0 rounded-2xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Add New Monitor
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#9ca3af] mt-1">
                Create a dashboard monitor for real-time vitals
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] hover:text-[#6b7280] text-[20px] leading-none mt-0.5"
            >
              ×
            </button>
          </div>
          <div className="mt-5 h-px bg-[#e5e7eb]" />
        </div>

        {/* Body */}
        <div className="px-8 pt-5 pb-0 flex flex-col gap-5">
          {/* Monitor Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Monitor Name <span className="text-[#2563eb]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ICU Monitor"
              className="h-10 rounded-lg border-[#d1d5db] text-[14px]"
            />
          </div>

          {/* Layout */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#6b737d]">
              Layout <span className="text-[#2563eb]">*</span>
            </label>
            <Select value={layout} onValueChange={(val) => { if (val) setLayout(val) }}>
              <SelectTrigger className="h-10 w-full rounded-lg border-[#d6d9db] text-[14px] text-[#38404a]">
                <SelectValue placeholder="Select layout..." />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info banner */}
          <div className="flex items-center gap-2 bg-[#eff6ff] rounded-lg px-3 h-10">
            <span className="size-2 rounded-full bg-[#2563eb] shrink-0" />
            <span className="text-[12px] text-[#2563eb]">
              URL Key will be auto-generated upon creation.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 pt-5">
          <div className="h-px bg-[#e5e7eb] mb-5" />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] text-[14px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !layout}
              className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold"
            >
              Add Monitor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

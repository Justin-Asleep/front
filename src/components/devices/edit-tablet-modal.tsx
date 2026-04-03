"use client"

import { useState, useEffect } from "react"
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
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface BedOption {
  id: string
  label: string
  room_name: string
  ward_name: string
}

interface TabletData {
  id: string
  serial_number: string
  bed_id: string | null
  is_active: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tablet: TabletData | null
  beds: BedOption[]
  onSave?: (data: { id: string; bedId: string | null; isActive: boolean; deviceSecret: string }) => void
}

export function EditTabletModal({ open, onOpenChange, tablet, beds, onSave }: Props) {
  const [bedId, setBedId] = useState(tablet?.bed_id ?? "")
  const [active, setActive] = useState(tablet?.is_active ?? true)
  const [newSecret, setNewSecret] = useState("")

  useEffect(() => {
    if (tablet) {
      setBedId(tablet.bed_id ?? "")
      setActive(tablet.is_active)
      setNewSecret("")
    }
  }, [tablet])

  function handleSave() {
    if (!tablet) return
    onSave?.({
      id: tablet.id,
      bedId: bedId || null,
      isActive: active,
      deviceSecret: newSecret,
    })
  }

  function handleCancel() {
    onOpenChange(false)
  }

  return (
    <Dialog key={tablet?.id} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-[20px] font-bold text-[#111827]">
                  Edit Tablet
                </DialogTitle>
              </DialogHeader>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Update tablet device settings
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] text-[16px] hover:text-[#6b7280] leading-none mt-1"
            >
              ✕
            </button>
          </div>
          <div className="border-t border-[#e5e7eb] mt-5" />
        </div>

        {/* Body */}
        <div className="px-8 pt-5 pb-5 flex flex-col gap-4">
          {/* Serial Number — read only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#9ca3af]">
              Serial Number
            </label>
            <div className="h-10 bg-[#f9fafb] rounded-lg flex items-center px-3.5">
              <span className="text-[14px] font-medium text-[#4b5563]">
                {tablet?.serial_number ?? ""}
              </span>
            </div>
          </div>

          {/* Assign to Bed */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Assign to Bed
            </label>
            <Select value={bedId} onValueChange={(v) => setBedId(v ?? "")}>
              <SelectTrigger className="h-10 w-full border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue placeholder="Select bed..." />
              </SelectTrigger>
              <SelectContent>
                {beds.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.ward_name} / {b.room_name} / {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status toggle */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#111827]">Status</label>
            <div className="flex items-center gap-3">
              <Switch
                checked={active}
                onCheckedChange={setActive}
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

          <div className="border-t border-[#e5e7eb]" />

          {/* Reset Device Secret */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Reset Device Secret
            </label>
            <Input
              type="password"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="Leave blank to keep current secret"
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>
        </div>

        <div className="h-px bg-[#e5e7eb] mx-8" />

        {/* Footer */}
        <div className="px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] font-medium text-[14px] rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px] rounded-lg"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const MOCK_BEDS = [
  "Ward A / Room 101 / Bed 101",
  "Ward A / Room 102 / Bed 102",
  "Ward A / Room 103 / Bed 103",
  "Ward B / Room 201 / Bed 201",
  "Ward B / Room 202 / Bed 202",
  "Ward B / Room 203 / Bed 203",
  "Ward C / Room 301 / Bed 301",
  "Ward C / Room 302 / Bed 302",
]

type Tablet = {
  id: string
  serial: string
  wardRoom: string
  status: "Active" | "Inactive"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tablet: Tablet | null
  onSave?: (data: { id: string; bed: string; status: "Active" | "Inactive"; newSecret: string }) => void
}

export function EditTabletModal({ open, onOpenChange, tablet, onSave }: Props) {
  const [bed, setBed] = useState(tablet?.wardRoom ?? "")
  const [active, setActive] = useState(tablet?.status !== "Inactive")
  const [newSecret, setNewSecret] = useState("")

  function handleSave() {
    if (!tablet || !bed) return
    onSave?.({ id: tablet.id, bed, status: active ? "Active" : "Inactive", newSecret })
    onOpenChange(false)
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
                {tablet?.serial ?? ""}
              </span>
            </div>
          </div>

          {/* Assign to Bed */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Assign to Bed <span className="text-[#dc2626]">*</span>
            </label>
            <Select value={bed} onValueChange={(v) => setBed(v ?? "")}>
              <SelectTrigger className="h-10 w-full border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue placeholder="Select bed..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_BEDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Status</label>
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <span
                className={cn(
                  "text-[12px] font-medium px-2 py-0.5 rounded-full",
                  active
                    ? "bg-[#dcfce7] text-[#16a34a]"
                    : "bg-[#f3f4f6] text-[#9ca3af]"
                )}
              >
                {active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Divider */}
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

        {/* Footer */}
        <DialogFooter className="px-8 py-4 flex-row justify-end gap-2 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 px-5 border-[#d1d5db] text-[#4b5563] font-medium text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!bed}
            className="h-10 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px]"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

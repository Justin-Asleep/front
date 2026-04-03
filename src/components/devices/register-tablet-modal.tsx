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
import { SearchableSelect } from "@/components/ui/searchable-select"

interface BedOption {
  id: string
  label: string
  room_name: string
  ward_name: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  beds: BedOption[]
  onRegister?: (data: { serial: string; secret: string; bedId: string }) => void
}

export function RegisterTabletModal({ open, onOpenChange, beds, onRegister }: Props) {
  const [serial, setSerial] = useState("")
  const [secret, setSecret] = useState("")
  const [bedId, setBedId] = useState("")

  function handleSubmit() {
    if (!serial || !secret || !bedId) return
    onRegister?.({ serial, secret, bedId })
    resetForm()
    onOpenChange(false)
  }

  function handleCancel() {
    resetForm()
    onOpenChange(false)
  }

  function resetForm() {
    setSerial("")
    setSecret("")
    setBedId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  Register New Tablet
                </DialogTitle>
              </DialogHeader>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Add a tablet device to a hospital bed
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Serial Number <span className="text-[#dc2626]">*</span>
            </label>
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g. TAB-007-G"
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Device Secret <span className="text-[#dc2626]">*</span>
            </label>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter device authentication secret"
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[#111827]">
              Assign to Bed <span className="text-[#dc2626]">*</span>
            </label>
            <SearchableSelect
              value={bedId}
              onValueChange={setBedId}
              options={beds.map((b) => ({
                value: b.id,
                label: `${b.ward_name} / ${b.room_name} / ${b.label}`,
              }))}
              placeholder="Select bed..."
              className="border-[#d1d5db] text-[14px]"
            />
          </div>

          <div className="bg-[#eff6ff] rounded-lg px-4 py-3 flex gap-2">
            <span className="mt-0.5 size-2 rounded-full bg-[#2563eb] flex-shrink-0" />
            <div>
              <p className="text-[12px] text-[#2563eb]">
                Device secret will be hashed. Keep it safe — it cannot be retrieved later.
              </p>
              <p className="text-[11px] text-[#4b82f6] mt-0.5">
                Use format: serial:secret for X-Device-Token header.
              </p>
            </div>
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
            onClick={handleSubmit}
            disabled={!serial || !secret || !bedId}
            className="h-10 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px]"
          >
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type Station = {
  id: string
  name: string
  wardId: string
  wardName: string
  urlKey: string
  status: "Active" | "Inactive"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  station: Station
  onSubmit?: (data: { name: string; status: "Active" | "Inactive" }) => void
}

export function EditStationModal({ open, onOpenChange, station, onSubmit }: Props) {
  const [name, setName] = useState(station.name)
  const [active, setActive] = useState(station.status === "Active")
  const [copied, setCopied] = useState(false)

  function handleCopyUrl() {
    navigator.clipboard.writeText(station.urlKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    if (!name.trim()) return
    onSubmit?.({ name: name.trim(), status: active ? "Active" : "Inactive" })
    onOpenChange(false)
  }

  function handleCancel() {
    setName(station.name)
    setActive(station.status === "Active")
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
                Edit Station
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#6b737d] mt-1">
                Update station configuration
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
              className="h-10 rounded-lg border-[#d6d9db] text-[14px] text-[#38404a]"
            />
          </div>

          {/* Ward (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#a1a8b2]">Ward</label>
            <div className="h-10 bg-[#f7f7f7] rounded-lg px-3 flex items-center text-[14px] text-[#6b737d]">
              {station.wardName}
            </div>
          </div>

          {/* URL Key (read-only + copy) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-[#a1a8b2]">URL Key</label>
            <div className="h-10 bg-[#f7f7f7] rounded-lg px-3 flex items-center justify-between">
              <span className="text-[14px] text-[#6b737d] font-mono truncate max-w-[340px]">
                {station.urlKey}
              </span>
              <button
                onClick={handleCopyUrl}
                className="text-[13px] font-medium text-[#2563eb] hover:text-[#1d4ed8] ml-2 shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Status */}
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
              onClick={handleSave}
              disabled={!name.trim()}
              className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-medium"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

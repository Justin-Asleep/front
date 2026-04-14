"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false }
)

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
  onSave?: (data: { id: string; bedId: string | null; isActive: boolean; resetSecret: boolean }) => Promise<{ device_secret?: string | null } | undefined>
}

export function EditTabletModal({ open, onOpenChange, tablet, beds, onSave }: Props) {
  const [bedId, setBedId] = useState(tablet?.bed_id ?? "")
  const [active, setActive] = useState(tablet?.is_active ?? true)
  const [resetSecret, setResetSecret] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  useEffect(() => {
    if (tablet) {
      setBedId(tablet.bed_id ?? "")
      setActive(tablet.is_active)
      setResetSecret(false)
      setNewSecret(null)
    }
  }, [tablet])

  async function handleSave() {
    if (!tablet) return
    const result = await onSave?.({
      id: tablet.id,
      bedId: bedId || null,
      isActive: active,
      resetSecret,
    })
    if (result?.device_secret) {
      setNewSecret(result.device_secret)
    }
  }

  function handleClose() {
    setNewSecret(null)
    setResetSecret(false)
    onOpenChange(false)
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  // Show new secret after reset
  if (newSecret) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
          showCloseButton={false}
        >
          <DialogHeader className="px-8 pt-7 pb-0 gap-1">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-[20px] font-bold text-[#111827]">
                  Secret Reset Complete
                </DialogTitle>
                <p className="text-[14px] text-[#9ca3af] mt-1">
                  New device secret for {tablet?.serial_number}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

          <div className="px-8 py-5 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#9ca3af]">New Device Secret</label>
              <div className="flex items-center gap-2 min-h-10 bg-[#f9fafb] rounded-lg px-3.5 py-2">
                <span className="flex-1 text-[13px] font-mono font-medium text-[#111827] break-all">{newSecret}</span>
                <button onClick={() => copyToClipboard(newSecret, "Secret")} className="text-[#9ca3af] hover:text-[#4b5563] shrink-0">
                  <Copy className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-lg border border-[#e5e7eb]">
                <QRCodeSVG
                  value={typeof window !== "undefined" && tablet?.serial_number
                    ? `${window.location.origin}/tablet?serial=${encodeURIComponent(tablet.serial_number)}&secret=${encodeURIComponent(newSecret)}`
                    : ""}
                  size={160}
                  level="M"
                />
              </div>
            </div>
            <p className="text-center text-[11px] text-[#9ca3af]">
              Scan to open tablet & auto-login
            </p>

            <div className="flex items-start gap-2 bg-[#fffbeb] rounded-lg px-3 py-2.5">
              <div className="mt-0.5 size-2 rounded-full bg-[#ca8a04] shrink-0" />
              <div>
                <p className="text-[12px] font-medium text-[#92400e]">
                  This is the only time the new secret will be shown.
                </p>
                <p className="text-[11px] text-[#b45309]">
                  Token: <code className="bg-[#fef3c7] px-1 rounded break-all">{tablet?.serial_number}:{newSecret}</code>
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#e5e7eb] mx-8" />

          <div className="px-8 py-4 flex justify-end gap-2">
            <Button
              onClick={() => copyToClipboard(`${tablet?.serial_number}:${newSecret}`, "Token")}
              variant="outline"
              className="h-10 w-[120px] border-[#d1d5db] text-[#4b5563] font-medium text-[14px] rounded-lg"
            >
              Copy Token
            </Button>
            <Button
              onClick={handleClose}
              className="h-10 w-[100px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px] rounded-lg"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog key={tablet?.id} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Edit Tablet
              </DialogTitle>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Update tablet device settings
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-[#9ca3af] text-[16px] leading-none hover:text-[#6b7280] mt-0.5"
            >
              x
            </button>
          </div>
        </DialogHeader>

        <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

        <div className="px-8 py-5 space-y-5">
          {/* Serial Number — read only */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#9ca3af]">Serial Number</label>
            <div className="h-10 bg-[#f9fafb] rounded-lg flex items-center px-3.5">
              <span className="text-[14px] font-medium text-[#4b5563]">
                {tablet?.serial_number ?? ""}
              </span>
            </div>
          </div>

          {/* Assign to Bed */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Assign to Bed</label>
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

          <div className="h-px bg-[#e5e7eb]" />

          {/* Reset Device Secret */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Device Secret</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setResetSecret(!resetSecret)}
                className={cn(
                  "h-9 px-3 text-[13px] font-medium rounded-lg gap-1.5",
                  resetSecret
                    ? "border-[#fca5a5] text-[#dc2626] bg-[#fef2f2]"
                    : "border-[#d1d5db] text-[#4b5563]"
                )}
              >
                <RefreshCw className="size-3.5" />
                {resetSecret ? "Will reset on save" : "Reset Secret"}
              </Button>
              {resetSecret && (
                <button
                  onClick={() => setResetSecret(false)}
                  className="text-[12px] text-[#9ca3af] hover:text-[#4b5563] underline"
                >
                  Cancel
                </button>
              )}
            </div>
            {resetSecret && (
              <p className="text-[11px] text-[#dc2626]">
                A new secret will be auto-generated and shown once after saving.
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-[#e5e7eb] mx-8" />

        <div className="px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
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

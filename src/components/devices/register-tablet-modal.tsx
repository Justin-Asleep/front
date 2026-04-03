"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Copy } from "lucide-react"
import { toast } from "sonner"

interface BedOption {
  id: string
  label: string
  room_name: string
  ward_name: string
}

interface RegisterResult {
  serial_number: string
  device_secret: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  beds: BedOption[]
  onRegister?: (data: { bedId: string }) => Promise<RegisterResult | undefined>
}

export function RegisterTabletModal({ open, onOpenChange, beds, onRegister }: Props) {
  const [bedId, setBedId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RegisterResult | null>(null)

  async function handleSubmit() {
    if (!bedId) return
    setLoading(true)
    try {
      const res = await onRegister?.({ bedId })
      if (res) setResult(res)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setBedId("")
    setResult(null)
    onOpenChange(false)
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  // Show credentials after registration
  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden"
          showCloseButton={false}
        >
          <div className="px-8 pt-7 pb-0">
            <DialogHeader>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Tablet Registered
              </DialogTitle>
            </DialogHeader>
            <p className="text-[14px] text-[#9ca3af] mt-1">
              Save these credentials — the secret cannot be retrieved later.
            </p>
            <div className="border-t border-[#e5e7eb] mt-5" />
          </div>

          <div className="px-8 pt-5 pb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#9ca3af]">Serial Number</label>
              <div className="flex items-center gap-2 h-10 bg-[#f9fafb] rounded-lg px-3.5">
                <span className="flex-1 text-[14px] font-mono font-medium text-[#111827]">{result.serial_number}</span>
                <button onClick={() => copyToClipboard(result.serial_number, "Serial")} className="text-[#9ca3af] hover:text-[#4b5563]">
                  <Copy className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#9ca3af]">Device Secret</label>
              <div className="flex items-center gap-2 h-10 bg-[#f9fafb] rounded-lg px-3.5">
                <span className="flex-1 text-[14px] font-mono font-medium text-[#111827] truncate">{result.device_secret}</span>
                <button onClick={() => copyToClipboard(result.device_secret, "Secret")} className="text-[#9ca3af] hover:text-[#4b5563]">
                  <Copy className="size-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#fffbeb] rounded-lg px-4 py-3 flex gap-2">
              <span className="mt-0.5 size-2 rounded-full bg-[#ca8a04] flex-shrink-0" />
              <p className="text-[12px] text-[#92400e]">
                This is the only time the device secret will be shown. Store it securely.
                <br />
                <span className="text-[11px]">
                  Token format: <code className="bg-[#fef3c7] px-1 rounded">{result.serial_number}:{result.device_secret}</code>
                </span>
              </p>
            </div>
          </div>

          <div className="border-t border-[#e5e7eb] px-8 py-4 flex justify-end gap-2">
            <Button
              onClick={() => {
                copyToClipboard(`${result.serial_number}:${result.device_secret}`, "Token")
              }}
              variant="outline"
              className="h-10 px-5 border-[#d1d5db] text-[#4b5563] font-medium text-[14px]"
            >
              Copy Token
            </Button>
            <Button
              onClick={handleClose}
              className="h-10 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden"
        showCloseButton={false}
      >
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-[20px] font-bold text-[#111827]">
                  Register New Tablet
                </DialogTitle>
              </DialogHeader>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Assign a tablet to a hospital bed
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-[#9ca3af] text-[16px] hover:text-[#6b7280] leading-none mt-1"
            >
              ✕
            </button>
          </div>
          <div className="border-t border-[#e5e7eb] mt-5" />
        </div>

        <div className="px-8 pt-5 pb-5 flex flex-col gap-4">
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
            <p className="text-[12px] text-[#2563eb]">
              Serial number and device secret will be auto-generated.
              <br />
              <span className="text-[11px] text-[#4b82f6]">
                Credentials will be displayed once after registration.
              </span>
            </p>
          </div>
        </div>

        <div className="border-t border-[#e5e7eb] px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-10 px-5 border-[#d1d5db] text-[#4b5563] font-medium text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!bedId || loading}
            className="h-10 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[14px]"
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

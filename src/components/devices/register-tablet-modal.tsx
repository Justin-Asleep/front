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
import dynamic from "next/dynamic"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
)

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
  onRegister?: (data: { bedId?: string }) => Promise<RegisterResult | undefined>
}

export function RegisterTabletModal({ open, onOpenChange, beds, onRegister }: Props) {
  const [bedId, setBedId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RegisterResult | null>(null)

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await onRegister?.(bedId ? { bedId } : {})
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        {result ? (
          <>
            <DialogHeader className="px-8 pt-7 pb-0 gap-1">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-[20px] font-bold text-[#111827]">
                    Tablet Registered
                  </DialogTitle>
                  <p className="text-[14px] text-[#9ca3af] mt-1">
                    Save these credentials — the secret cannot be retrieved later.
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

            <div className="px-8 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#9ca3af]">Serial Number</label>
                <div className="flex items-center gap-2 h-10 bg-[#f9fafb] rounded-lg px-3.5">
                  <span className="flex-1 text-[14px] font-mono font-medium text-[#111827]">{result.serial_number}</span>
                  <button onClick={() => copyToClipboard(result.serial_number, "Serial")} className="text-[#9ca3af] hover:text-[#4b5563]">
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#9ca3af]">Device Secret</label>
                <div className="flex items-center gap-2 min-h-10 bg-[#f9fafb] rounded-lg px-3.5 py-2">
                  <span className="flex-1 text-[13px] font-mono font-medium text-[#111827] break-all">{result.device_secret}</span>
                  <button onClick={() => copyToClipboard(result.device_secret, "Secret")} className="text-[#9ca3af] hover:text-[#4b5563] shrink-0">
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <div className="bg-white p-3 rounded-lg border border-[#e5e7eb]">
                  <QRCodeSVG
                    value={`vitalmonitor://login?serial=${encodeURIComponent(result.serial_number)}&secret=${encodeURIComponent(result.device_secret)}`}
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
                    This is the only time the device secret will be shown.
                  </p>
                  <p className="text-[11px] text-[#b45309]">
                    Token format: <code className="bg-[#fef3c7] px-1 rounded break-all">{result.serial_number}:{result.device_secret}</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#e5e7eb] mx-8" />

            <div className="px-8 py-4 flex justify-end gap-2">
              <Button
                onClick={() => copyToClipboard(`${result.serial_number}:${result.device_secret}`, "Token")}
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
          </>
        ) : (
          <>
            <DialogHeader className="px-8 pt-7 pb-0 gap-1">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-[20px] font-bold text-[#111827]">
                    Register New Tablet
                  </DialogTitle>
                  <p className="text-[14px] text-[#9ca3af] mt-1">
                    Assign a tablet to a hospital bed
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
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#111827]">
                  Assign to Bed
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

              <div className="flex items-start gap-2 bg-[#eff6ff] rounded-lg px-3 py-2.5">
                <div className="mt-0.5 size-2 rounded-full bg-[#2563eb] shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-[#2563eb]">
                    Serial number and device secret will be auto-generated.
                  </p>
                  <p className="text-[11px] text-[#4b82f6]">
                    Credentials will be displayed once after registration.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#e5e7eb] mx-8" />

            <div className="px-8 py-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] text-[14px] font-medium rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

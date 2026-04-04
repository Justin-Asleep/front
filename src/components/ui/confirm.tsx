"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

type ConfirmVariant = "danger" | "warning" | "default"

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

const VARIANT_STYLES: Record<ConfirmVariant, { icon: string; iconBg: string; btn: string }> = {
  danger: {
    icon: "text-[#dc2626]",
    iconBg: "bg-[#fef2f2]",
    btn: "bg-[#dc2626] hover:bg-[#b91c1c]",
  },
  warning: {
    icon: "text-[#ca8a04]",
    iconBg: "bg-[#fffbeb]",
    btn: "bg-[#ca8a04] hover:bg-[#a16207]",
  },
  default: {
    icon: "text-[#2563eb]",
    iconBg: "bg-[#eff6ff]",
    btn: "bg-[#2563eb] hover:bg-[#1d4ed8]",
  },
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm: ConfirmFn = useCallback((opts) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function handleResult(value: boolean) {
    setOpen(false)
    resolveRef.current?.(value)
    resolveRef.current = null
  }

  const variant = options?.variant ?? "default"
  const styles = VARIANT_STYLES[variant]

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleResult(false) }}>
        <DialogContent className="max-w-[420px] p-0 rounded-2xl" showCloseButton={false}>
          <div className="flex flex-col items-center px-8 pt-8 pb-5 gap-3">
            <div className={`flex size-12 items-center justify-center rounded-full ${styles.iconBg}`}>
              <span className={`text-xl font-bold ${styles.icon}`}>!</span>
            </div>
            <h2 className="text-[18px] font-bold text-[#111827] text-center">
              {options?.title}
            </h2>
            {options?.description && (
              <p className="text-[14px] text-[#4b5563] text-center leading-relaxed">
                {options.description}
              </p>
            )}
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          <div className="flex items-center justify-center gap-3 px-8 py-4">
            <DialogPrimitive.Close
              render={
                <button className="h-10 w-[110px] rounded-lg border border-[#d1d5db] text-[14px] text-[#4b5563] hover:bg-[#f9fafb]" />
              }
            >
              {options?.cancelText ?? "Cancel"}
            </DialogPrimitive.Close>
            <Button
              className={`h-10 w-[110px] text-white font-semibold text-[14px] rounded-lg ${styles.btn}`}
              onClick={() => handleResult(true)}
            >
              {options?.confirmText ?? "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx
}

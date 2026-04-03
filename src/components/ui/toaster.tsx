"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          fontSize: "14px",
          borderRadius: "12px",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
        classNames: {
          error: "!bg-[#fef2f2] !text-[#991b1b] !border !border-[#fecaca]",
          success: "!bg-[#f0fdf4] !text-[#166534] !border !border-[#bbf7d0]",
          info: "!bg-[#eff6ff] !text-[#1e40af] !border !border-[#bfdbfe]",
          warning: "!bg-[#fffbeb] !text-[#92400e] !border !border-[#fde68a]",
        },
      }}
    />
  )
}

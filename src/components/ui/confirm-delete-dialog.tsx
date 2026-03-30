"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  targetName: string
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  targetName,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] p-0" showCloseButton={false}>
        <div className="flex flex-col items-center px-8 pt-8 pb-6 gap-4">
          {/* Warning icon */}
          <div className="flex size-14 items-center justify-center rounded-full bg-[#fef2f2]">
            <span className="text-2xl font-bold text-[#dc2626]">!</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-[#111827] text-center">{title}</h2>

          {/* Body */}
          <p className="text-sm text-[#4b5563] text-center">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[#111827]">{targetName}</span>?
            {" "}This action cannot be undone.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e5e7eb]" />

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 px-8 py-5">
          <DialogPrimitive.Close
            render={
              <button className="h-11 w-[120px] rounded-lg border border-[#d1d5db] text-sm text-[#4b5563] hover:bg-[#f9fafb]" />
            }
          >
            Cancel
          </DialogPrimitive.Close>
          <Button
            className="h-11 w-[120px] bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-sm rounded-lg"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

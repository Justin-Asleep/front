"use client"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  onConfirm?: () => void
}

export function DeletePatientModal({ open, onOpenChange, patientName, onConfirm }: Props) {
  function handleDelete() {
    onConfirm?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] p-0 gap-0 rounded-[16px] overflow-hidden"
      >
        <div className="px-8 pt-8 pb-0 flex flex-col items-center text-center">
          {/* Warning icon */}
          <div className="size-14 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
            <span className="text-[24px] font-bold text-[#dc2626]">!</span>
          </div>

          <h2 className="text-[20px] font-bold text-[#111827]">Delete Patient</h2>
          <p className="text-[14px] text-[#4b5563] mt-3 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[#111827]">{patientName}</span>?
            <br />
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] px-8 py-4 mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 w-[120px] border-[#d1d5db] text-[#4b5563] text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="h-11 w-[120px] bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[14px] font-semibold"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

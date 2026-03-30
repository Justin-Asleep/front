"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  Dialog,
  DialogContent,
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

type Patient = {
  mrn: string
  name: string
  dob: string
  gender: string
  hospital: string
  phone?: string
  emergencyContact?: string
  notes?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onSubmit?: (data: Patient) => void
}

const HOSPITALS = ["Seoul General", "Yonsei Medical", "Asan Medical"]
const GENDERS = ["Male", "Female", "Other"]

export function EditPatientModal({ open, onOpenChange, patient, onSubmit }: Props) {
  const [form, setForm] = useState<Patient>({
    mrn: patient?.mrn ?? "",
    name: patient?.name ?? "",
    dob: patient?.dob ?? "",
    gender: patient?.gender ?? "",
    hospital: patient?.hospital ?? "",
    phone: patient?.phone ?? "",
    emergencyContact: patient?.emergencyContact ?? "",
    notes: patient?.notes ?? "",
  })

  function handleChange(field: keyof Patient, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    onSubmit?.(form)
    onOpenChange(false)
  }

  return (
    <Dialog key={patient?.mrn} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[580px] p-0 gap-0 rounded-[16px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">Edit Patient</h2>
              <p className="text-[14px] text-[#9ca3af] mt-1">Update patient information</p>
            </div>
            <DialogPrimitive.Close
              render={
                <button className="text-[16px] text-[#9ca3af] hover:text-[#6b7280] leading-none mt-1">✕</button>
              }
            />
          </div>
          <div className="border-b border-[#e5e7eb] mt-5" />
        </div>

        {/* Body */}
        <div className="px-8 py-5 space-y-5">
          {/* Row 1: MRN + Name */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">MRN *</label>
              <Input
                value={form.mrn}
                onChange={(e) => handleChange("mrn", e.target.value)}
                className="h-10 border-[#d1d5db] text-[14px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">Full Name *</label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-10 border-[#d1d5db] text-[14px]"
              />
            </div>
          </div>

          {/* Row 2: DOB + Gender */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">Date of Birth</label>
              <Input
                value={form.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="h-10 border-[#d1d5db] text-[14px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">Gender</label>
              <Select value={form.gender} onValueChange={(v) => handleChange("gender", v ?? "")}>
                <SelectTrigger className="h-10 border-[#d1d5db] text-[14px] w-full">
                  <SelectValue placeholder="Select gender..." />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Hospital (full width) */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Hospital *</label>
            <Select value={form.hospital} onValueChange={(v) => handleChange("hospital", v ?? "")}>
              <SelectTrigger className="h-10 border-[#d1d5db] text-[14px] w-full">
                <SelectValue placeholder="Select hospital..." />
              </SelectTrigger>
              <SelectContent>
                {HOSPITALS.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section: Contact Information */}
          <div className="border-t border-[#e5e7eb] pt-4">
            <p className="text-[14px] font-semibold text-[#4b5563] mb-4">Contact Information</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#111827]">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="h-10 border-[#d1d5db] text-[14px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#111827]">Emergency Contact</label>
                <Input
                  value={form.emergencyContact}
                  onChange={(e) => handleChange("emergencyContact", e.target.value)}
                  className="h-10 border-[#d1d5db] text-[14px]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full h-[52px] border border-[#d1d5db] rounded-[8px] px-3 py-2 text-[14px] text-[#111827] placeholder:text-[#9ca3af] resize-none focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-6 border-[#d1d5db] text-[#4b5563] text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type PatientDetail = {
  mrn: string
  name: string
  gender: string
  admittedDate: string
  bed: string
  ward: string
  room: string
  attending: string
  status: "Normal" | "Warning" | "Critical"
  vitals: {
    hr: number
    spo2: number
    rr: number
    temp: number
    bp: string
  }
  vitalsUpdated?: string
  alarmNote?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: PatientDetail | null
  onMeasurementHistory?: () => void
  onDischarge?: () => void
}

const VITALS_CONFIG = [
  { key: "hr" as const, label: "HR", unit: "bpm", color: "#22c55e" },
  { key: "spo2" as const, label: "SpO2", unit: "%", color: "#38bef8" },
  { key: "rr" as const, label: "RR", unit: "/min", color: "#fbbf24" },
  { key: "temp" as const, label: "Temp", unit: "C", color: "#a78bfb" },
  { key: "bp" as const, label: "BP", unit: "mmHg", color: "#f87171" },
]

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Normal:   { bg: "#dcfce7", text: "#16a34a" },
  Warning:  { bg: "#fef9c3", text: "#ca8a04" },
  Critical: { bg: "#fee2e2", text: "#dc2626" },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ViewDetailModal({ open, onOpenChange, patient, onMeasurementHistory, onDischarge }: Props) {
  if (!patient) return null

  const statusStyle = STATUS_STYLES[patient.status] ?? STATUS_STYLES.Normal
  const initials = getInitials(patient.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[560px] p-0 gap-0 rounded-[16px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">Patient Detail</h2>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Bed {patient.bed} - {patient.ward}
              </p>
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
          {/* Patient identity */}
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="bg-[#eff6ff] text-[#2563eb] font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[18px] font-bold text-[#111827]">{patient.name}</p>
              <p className="text-[13px] text-[#9ca3af]">MRN: {patient.mrn}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#dcfce7] text-[#16a34a]">
              Admitted: {patient.admittedDate}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#eff6ff] text-[#2563eb]">
              Gender: {patient.gender}
            </span>
          </div>

          {/* Latest Vitals */}
          <div className="border-t border-[#e5e7eb] pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-semibold text-[#111827]">Latest Vitals</p>
              {patient.vitalsUpdated && (
                <p className="text-[12px] text-[#9ca3af]">{patient.vitalsUpdated}</p>
              )}
            </div>
            <div className="flex gap-2">
              {VITALS_CONFIG.map((v) => {
                const value = patient.vitals[v.key]
                return (
                  <div
                    key={v.key}
                    className="flex-1 bg-[#f9fafb] rounded-[10px] overflow-hidden"
                    style={{ minWidth: 0 }}
                  >
                    <div style={{ height: 3, backgroundColor: v.color }} />
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-[#9ca3af]">{v.label}</p>
                      <p className="text-[18px] font-bold leading-tight" style={{ color: v.color }}>
                        {value}
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">{v.unit}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <p className="text-[13px] font-medium text-[#111827]">Status</p>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {patient.status}
            </span>
            {patient.alarmNote && (
              <p className="text-[13px] text-[#9ca3af]">{patient.alarmNote}</p>
            )}
          </div>

          {/* Encounter Information */}
          <div className="border-t border-[#e5e7eb] pt-4">
            <p className="text-[15px] font-semibold text-[#111827] mb-3">Encounter Information</p>
            <div className="space-y-2">
              {[
                { label: "Admission Date", value: patient.admittedDate },
                { label: "Ward / Room", value: `${patient.ward} - ${patient.room}` },
                { label: "Bed", value: patient.bed },
                { label: "Attending", value: patient.attending },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline gap-4">
                  <p className="text-[13px] text-[#9ca3af] w-[160px] shrink-0">{label}</p>
                  <p className="text-[13px] font-medium text-[#111827]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onMeasurementHistory}
            className="h-10 px-4 border-[#2563eb] text-[#2563eb] text-[13px] font-semibold hover:bg-[#eff6ff]"
          >
            Measurement History
          </Button>
          <Button
            variant="outline"
            onClick={onDischarge}
            className="h-10 px-4 border-[#dc2626] bg-[#fef2f2] text-[#dc2626] text-[13px] font-semibold hover:bg-[#fee2e2]"
          >
            Discharge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

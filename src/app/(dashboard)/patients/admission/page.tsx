"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ViewDetailModal } from "@/components/patients/view-detail-modal"
import { AssignPatientModal } from "@/components/patients/assign-patient-modal"

type BedStatus = "occupied" | "empty"

interface BedData {
  id: string
  status: BedStatus
  patient?: string
  since?: string
}

const WARDS = [
  { id: "internal", label: "Internal Med" },
  { id: "surgery", label: "Surgery" },
  { id: "pediatrics", label: "Pediatrics" },
  { id: "icu", label: "ICU" },
  { id: "emergency", label: "Emergency" },
  { id: "rehab", label: "Rehab" },
]

const BEDS: BedData[] = [
  { id: "301-1", status: "occupied", patient: "Kim Minjun", since: "2026-03-20" },
  { id: "301-2", status: "occupied", patient: "Park Soyeon", since: "2026-03-18" },
  { id: "301-3", status: "occupied", patient: "Lee Jungho", since: "2026-03-22" },
  { id: "301-4", status: "empty" },
  { id: "302-1", status: "occupied", patient: "Choi Yuna", since: "2026-03-21" },
  { id: "302-2", status: "empty" },
  { id: "302-3", status: "occupied", patient: "Jung Hyunwoo", since: "2026-03-15" },
  { id: "302-4", status: "occupied", patient: "Han Minji", since: "2026-03-23" },
  { id: "303-1", status: "occupied", patient: "Kang Seojun", since: "2026-03-19" },
  { id: "303-2", status: "empty" },
  { id: "303-3", status: "occupied", patient: "Yoon Jiyeon", since: "2026-03-24" },
  { id: "303-4", status: "occupied", patient: "Oh Donghyun", since: "2026-03-17" },
  { id: "304-1", status: "empty" },
  { id: "304-2", status: "occupied", patient: "Shin Areum", since: "2026-03-22" },
  { id: "304-3", status: "empty" },
  { id: "304-4", status: "occupied", patient: "Bae Junho", since: "2026-03-20" },
]

const AVAILABLE_PATIENTS = [
  { mrn: "P-001237", name: "Choi Yuna", dob: "1995-08-19" },
  { mrn: "P-001239", name: "Han Minji", dob: "1988-07-14" },
  { mrn: "P-001240", name: "Kang Seojun", dob: "1973-12-05" },
  { mrn: "P-001241", name: "Yoon Jiyeon", dob: "2001-04-22" },
  { mrn: "P-001242", name: "Shin Areum", dob: "1992-06-15" },
]

function groupBedsByRoom(beds: BedData[]) {
  const rooms = new Map<string, BedData[]>()
  for (const bed of beds) {
    const room = bed.id.split("-")[0]
    if (!rooms.has(room)) rooms.set(room, [])
    rooms.get(room)!.push(bed)
  }
  return Array.from(rooms.entries()).map(([room, beds]) => ({ room, beds }))
}

export default function AdmissionPage() {
  const router = useRouter()
  const [selectedWard, setSelectedWard] = useState("surgery")
  const [viewBed, setViewBed] = useState<BedData | null>(null)
  const [assignBedId, setAssignBedId] = useState<string | null>(null)

  const selectedWardLabel = WARDS.find((w) => w.id === selectedWard)?.label ?? ""
  const totalBeds = BEDS.length
  const occupiedCount = BEDS.filter((b) => b.status === "occupied").length
  const availableCount = BEDS.filter((b) => b.status === "empty").length
  const roomGroups = useMemo(() => groupBedsByRoom(BEDS), [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">Admission Management</h1>
        <p className="text-[14px] text-muted-foreground">
          Manage bed assignments and patient admissions by ward
        </p>
      </div>

      {/* Ward selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {WARDS.map((ward) => (
          <button
            key={ward.id}
            onClick={() => setSelectedWard(ward.id)}
            className={cn(
              "h-9 px-3 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer",
              selectedWard === ward.id
                ? "bg-[#2563eb] text-white border-[#2563eb] font-semibold"
                : "bg-white text-[#4b5563] border-[#d1d5db] hover:bg-[#f9fafb]"
            )}
          >
            {ward.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 bg-[#eff6ff] rounded-lg px-4 h-11">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#2563eb]" />
          <span className="text-[13px] text-[#4b5563]">Total:</span>
          <span className="text-[14px] font-bold text-[#2563eb]">{totalBeds}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#3b82f6]" />
          <span className="text-[13px] text-[#4b5563]">Occupied:</span>
          <span className="text-[14px] font-bold text-[#3b82f6]">{occupiedCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#94a3b8]" />
          <span className="text-[13px] text-[#4b5563]">Available:</span>
          <span className="text-[14px] font-bold text-[#64748b]">{availableCount}</span>
        </div>
      </div>

      <h2 className="text-[15px] font-semibold text-foreground">
        Bed Grid - {selectedWardLabel}
      </h2>

      {/* Room-grouped grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roomGroups.map(({ room, beds }) => {
          const roomOccupied = beds.filter((b) => b.status === "occupied").length
          return (
            <Card key={room} className="shadow-sm">
              <CardContent className="p-4">
                {/* Room header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-foreground">Room {room}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {roomOccupied}/{beds.length} occupied
                    </span>
                  </div>
                  <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563eb]"
                      style={{ width: `${(roomOccupied / beds.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Beds grid inside room */}
                <div className="grid grid-cols-2 gap-2">
                  {beds.map((bed) => {
                    const bedNum = bed.id.split("-")[1]
                    if (bed.status === "occupied") {
                      return (
                        <div
                          key={bed.id}
                          onClick={() => setViewBed(bed)}
                          className="rounded-lg bg-[#f2f6fe] border border-[#c7d1fa] border-l-[3px] border-l-[#2563eb] px-3 py-2.5 h-[72px] cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <span className="text-[12px] font-semibold text-[#2563eb]">Bed {bedNum}</span>
                          <p className="text-[13px] font-semibold text-foreground mt-0.5 truncate">{bed.patient}</p>
                          <p className="text-[10px] text-muted-foreground">{bed.since}</p>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={bed.id}
                        onClick={() => setAssignBedId(bed.id)}
                        className="rounded-lg bg-[#f9fafb] border border-dashed border-[#d1d5db] px-3 py-2.5 h-[72px] cursor-pointer hover:bg-[#f4f5f7] transition-colors flex flex-col items-center justify-center"
                      >
                        <span className="text-[12px] font-semibold text-muted-foreground">Bed {bedNum}</span>
                        <span className="text-[10px] font-medium text-[#4b5563] mt-1 border border-[#d1d5db] rounded px-1.5 py-0.5 bg-white">
                          + Assign
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      <ViewDetailModal
        open={viewBed !== null}
        onOpenChange={(open) => { if (!open) setViewBed(null) }}
        onMeasurementHistory={() => {
          setViewBed(null)
          router.push(`/patients/measurement?mrn=P-001234`)
        }}
        patient={viewBed ? {
          mrn: "P-001234",
          name: viewBed.patient ?? "",
          gender: "Male",
          admittedDate: viewBed.since ?? "2026-03-20",
          bed: viewBed.id,
          ward: `${selectedWardLabel} Ward`,
          room: `Room ${viewBed.id.split("-")[0]}`,
          attending: "Dr. Park Jihoon",
          status: "Normal",
          vitals: { hr: 72, spo2: 98, rr: 16, temp: 36.5, bp: "120/80" },
          vitalsUpdated: "Updated 5 min ago",
          alarmNote: "No active alarms",
        } : null}
      />

      <AssignPatientModal
        open={assignBedId !== null}
        onOpenChange={(open) => { if (!open) setAssignBedId(null) }}
        bedId={assignBedId ?? ""}
        wardName={selectedWardLabel}
        availablePatients={AVAILABLE_PATIENTS}
      />
    </div>
  )
}

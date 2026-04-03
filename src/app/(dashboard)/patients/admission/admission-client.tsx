"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ViewDetailModal } from "@/components/patients/view-detail-modal"
import { AssignPatientModal } from "@/components/patients/assign-patient-modal"
import { apiGet, apiPost } from "@/services/api"

interface EncounterWithPatient {
  encounter_id: string
  patient_id: string
  patient_name: string
  patient_mrn: string
  admitted_at: string
}

interface BedAdmission {
  id: string
  bed_number: number
  label: string
  encounter: EncounterWithPatient | null
}

interface RoomAdmission {
  id: string
  name: string
  room_type: number
  beds: BedAdmission[]
}

interface WardDTO {
  id: string
  name: string
  floor: number | null
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
}

interface AvailablePatient {
  id: string
  name: string
  medical_record_number: string
  date_of_birth: string | null
  gender: string | null
}

export function AdmissionClient() {
  const router = useRouter()
  const [wards, setWards] = useState<WardDTO[]>([])
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomAdmission[]>([])
  const [loading, setLoading] = useState(false)

  const [viewBed, setViewBed] = useState<BedAdmission | null>(null)
  const [viewRoom, setViewRoom] = useState<RoomAdmission | null>(null)
  const [assignBed, setAssignBed] = useState<BedAdmission | null>(null)

  const [availablePatients, setAvailablePatients] = useState<AvailablePatient[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)

  const selectedWard = wards.find((w) => w.id === selectedWardId)

  // Load wards on mount
  useEffect(() => {
    async function loadWards() {
      const data = await apiGet<PaginatedData<WardDTO>>("/proxy/wards?page=1&size=100")
      setWards(data.items)
      if (data.items.length > 0) setSelectedWardId(data.items[0].id)
    }
    loadWards()
  }, [])

  // Load admission status when ward changes
  const loadAdmissionStatus = useCallback(async (wardId: string) => {
    setLoading(true)
    try {
      const data = await apiGet<RoomAdmission[]>(`/proxy/wards/${wardId}/admission-status`)
      setRooms(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedWardId) loadAdmissionStatus(selectedWardId)
  }, [selectedWardId, loadAdmissionStatus])

  // Load available patients when assign modal opens
  const loadAvailablePatients = useCallback(async () => {
    setPatientsLoading(true)
    try {
      const data = await apiGet<AvailablePatient[]>("/proxy/patients/available")
      setAvailablePatients(data)
    } finally {
      setPatientsLoading(false)
    }
  }, [])

  function handleAssignClick(bed: BedAdmission) {
    setAssignBed(bed)
    loadAvailablePatients()
  }

  async function handleAdmit(patient: AvailablePatient) {
    if (!assignBed) return
    await apiPost(`/proxy/patients/${patient.id}/admit`, { bed_id: assignBed.id })
    setAssignBed(null)
    if (selectedWardId) loadAdmissionStatus(selectedWardId)
  }

  // Stats
  const allBeds = rooms.flatMap((r) => r.beds)
  const totalBeds = allBeds.length
  const occupiedCount = allBeds.filter((b) => b.encounter !== null).length
  const availableCount = totalBeds - occupiedCount

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
        {wards.map((ward) => (
          <button
            key={ward.id}
            onClick={() => setSelectedWardId(ward.id)}
            className={cn(
              "h-9 px-3 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer",
              selectedWardId === ward.id
                ? "bg-[#2563eb] text-white border-[#2563eb] font-semibold"
                : "bg-white text-[#4b5563] border-[#d1d5db] hover:bg-[#f9fafb]"
            )}
          >
            {ward.name}
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
        Bed Grid{selectedWard ? ` - ${selectedWard.name}` : ""}
      </h2>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-[14px]">Loading beds...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-[14px]">No rooms found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const roomOccupied = room.beds.filter((b) => b.encounter !== null).length
            return (
              <Card key={room.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-foreground">
                        Room {room.name}
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {roomOccupied}/{room.beds.length} occupied
                      </span>
                    </div>
                    <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2563eb]"
                        style={{
                          width: room.beds.length > 0
                            ? `${(roomOccupied / room.beds.length) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {room.beds.map((bed) => {
                      if (bed.encounter) {
                        return (
                          <div
                            key={bed.id}
                            onClick={() => { setViewBed(bed); setViewRoom(room) }}
                            className="rounded-lg bg-[#f2f6fe] border border-[#c7d1fa] border-l-[3px] border-l-[#2563eb] px-3 py-2.5 h-[72px] cursor-pointer hover:shadow-md transition-shadow"
                          >
                            <span className="text-[12px] font-semibold text-[#2563eb]">
                              Bed {bed.bed_number}
                            </span>
                            <p className="text-[13px] font-semibold text-foreground mt-0.5 truncate">
                              {bed.encounter.patient_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {bed.encounter.admitted_at.split("T")[0]}
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={bed.id}
                          onClick={() => handleAssignClick(bed)}
                          className="rounded-lg bg-[#f9fafb] border border-dashed border-[#d1d5db] px-3 py-2.5 h-[72px] cursor-pointer hover:bg-[#f4f5f7] transition-colors flex flex-col items-center justify-center"
                        >
                          <span className="text-[12px] font-semibold text-muted-foreground">
                            Bed {bed.bed_number}
                          </span>
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
      )}

      {/* View Detail Modal */}
      <ViewDetailModal
        open={viewBed !== null}
        onOpenChange={(open) => { if (!open) { setViewBed(null); setViewRoom(null) } }}
        onMeasurementHistory={() => {
          const mrn = viewBed?.encounter?.patient_mrn ?? ""
          setViewBed(null)
          setViewRoom(null)
          router.push(`/patients/measurement?mrn=${mrn}`)
        }}
        patient={viewBed?.encounter ? {
          mrn: viewBed.encounter.patient_mrn,
          name: viewBed.encounter.patient_name,
          gender: "",
          admittedDate: viewBed.encounter.admitted_at.split("T")[0],
          bed: viewBed.label,
          ward: selectedWard?.name ?? "",
          room: viewRoom ? `Room ${viewRoom.name}` : "",
          attending: "",
          status: "Normal",
          vitals: { hr: 0, spo2: 0, rr: 0, temp: 0, bp: "-/-" },
          vitalsUpdated: "",
          alarmNote: "No active alarms",
        } : null}
      />

      {/* Assign Patient Modal */}
      <AssignPatientModal
        open={assignBed !== null}
        onOpenChange={(open) => { if (!open) setAssignBed(null) }}
        bedId={assignBed?.label ?? ""}
        wardName={selectedWard?.name ?? ""}
        availablePatients={availablePatients.map((p) => ({
          id: p.id,
          mrn: p.medical_record_number,
          name: p.name,
          dob: p.date_of_birth ?? "",
        }))}
        onAdmit={(patient) => {
          const found = availablePatients.find((p) => p.id === patient.id)
          if (found) handleAdmit(found)
        }}
        loading={patientsLoading}
      />
    </div>
  )
}

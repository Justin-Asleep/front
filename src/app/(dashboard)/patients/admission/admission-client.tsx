"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const ViewDetailModal = dynamic(
  () => import("@/components/patients/view-detail-modal").then((m) => ({ default: m.ViewDetailModal })),
  { ssr: false }
)
const AssignPatientModal = dynamic(
  () => import("@/components/patients/assign-patient-modal").then((m) => ({ default: m.AssignPatientModal })),
  { ssr: false }
)
import { apiGet, apiPost } from "@/services/api"
import { useConfirm } from "@/components/ui/confirm"

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

interface EncounterDetailResponse {
  encounter_id: string
  patient_id: string
  patient_name: string
  patient_mrn: string
  patient_gender: string | null
  admitted_at: string
  status: string
  bed_label: string
  room_name: string
  ward_name: string
  vitals: {
    hr: number | null
    spo2: number | null
    rr: number | null
    temp: number | null
    bp_systolic: number | null
    bp_diastolic: number | null
    measured_at: string | null
  }
  latest_alarm: string | null
}

interface PatientDetail {
  mrn: string
  name: string
  gender: string
  admittedDate: string
  bed: string
  ward: string
  room: string
  attending: string
  status: "Normal" | "Warning" | "Critical"
  vitals: { hr: number; spo2: number; rr: number; temp: number; bp: string }
  vitalsUpdated?: string
  alarmNote?: string
}

export function AdmissionClient() {
  const router = useRouter()
  const confirm = useConfirm()
  const [wards, setWards] = useState<WardDTO[]>([])
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomAdmission[]>([])
  const [loading, setLoading] = useState(false)

  const [viewBed, setViewBed] = useState<BedAdmission | null>(null)
  const [viewRoom, setViewRoom] = useState<RoomAdmission | null>(null)
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null)
  const [assignBed, setAssignBed] = useState<BedAdmission | null>(null)

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

  async function handleAdmit(patient: { id: string }) {
    if (!assignBed) return
    await apiPost(`/proxy/patients/${patient.id}/admit`, { bed_id: assignBed.id })
    setAssignBed(null)
    if (selectedWardId) loadAdmissionStatus(selectedWardId)
  }

  async function handleViewBed(bed: BedAdmission, room: RoomAdmission) {
    if (!bed.encounter) return
    setViewBed(bed)
    setViewRoom(room)
    try {
      const detail = await apiGet<EncounterDetailResponse>(
        `/proxy/patients/encounters/${bed.encounter.encounter_id}/detail`
      )
      const bp = detail.vitals.bp_systolic && detail.vitals.bp_diastolic
        ? `${Math.round(detail.vitals.bp_systolic)}/${Math.round(detail.vitals.bp_diastolic)}`
        : "-/-"
      setPatientDetail({
        mrn: detail.patient_mrn,
        name: detail.patient_name,
        gender: detail.patient_gender ?? "",
        admittedDate: detail.admitted_at.split("T")[0],
        bed: detail.bed_label,
        ward: detail.ward_name,
        room: `Room ${detail.room_name}`,
        attending: "",
        status: detail.latest_alarm ? "Warning" : "Normal",
        vitals: {
          hr: detail.vitals.hr ?? 0,
          spo2: detail.vitals.spo2 ?? 0,
          rr: detail.vitals.rr ?? 0,
          temp: detail.vitals.temp ?? 0,
          bp,
        },
        vitalsUpdated: detail.vitals.measured_at?.split(".")[0].replace("T", " ") ?? "",
        alarmNote: detail.latest_alarm ?? "No active alarms",
      })
    } catch (err) {
      console.error("Failed to load encounter detail:", err)
    }
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
                            onClick={() => handleViewBed(bed, room)}
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
                          onClick={() => setAssignBed(bed)}
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
        onOpenChange={(open) => { if (!open) { setViewBed(null); setViewRoom(null); setPatientDetail(null) } }}
        onMeasurementHistory={() => {
          const mrn = viewBed?.encounter?.patient_mrn ?? ""
          setViewBed(null)
          setViewRoom(null)
          setPatientDetail(null)
          router.push(`/patients/measurement?mrn=${mrn}`)
        }}
        onDischarge={async () => {
          if (!viewBed?.encounter?.encounter_id) return
          const ok = await confirm({
            title: "Discharge Patient",
            description: `Are you sure you want to discharge ${viewBed.encounter.patient_name}?`,
            confirmText: "Discharge",
            variant: "danger",
          })
          if (!ok) return
          try {
            await apiPost(`/proxy/patients/encounters/${viewBed.encounter.encounter_id}/discharge`)
            setViewBed(null)
            setViewRoom(null)
            setPatientDetail(null)
            if (selectedWardId) loadAdmissionStatus(selectedWardId)
          } catch (err) {
            console.error("Failed to discharge:", err)
          }
        }}
        patient={patientDetail}
      />

      {/* Assign Patient Modal */}
      <AssignPatientModal
        open={assignBed !== null}
        onOpenChange={(open) => { if (!open) setAssignBed(null) }}
        bedId={assignBed?.label ?? ""}
        wardName={selectedWard?.name ?? ""}
        onAdmit={(patient) => handleAdmit(patient)}
      />
    </div>
  )
}

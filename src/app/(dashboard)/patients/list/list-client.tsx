"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { AddPatientModal } from "@/components/patients/add-patient-modal"
import { EditPatientModal } from "@/components/patients/edit-patient-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/services/api"
import { toast } from "sonner"

interface PatientListItemDTO {
  id: string
  hospital_id: string
  medical_record_number: string
  name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  emergency_contact_phone: string | null
  note: string | null
  is_active: boolean
  status: "Active" | "Admitted" | "Discharged"
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

type PatientStatus = "Active" | "Admitted" | "Discharged"

const PAGE_SIZE = 8

const statusBadgeClass: Record<PatientStatus, string> = {
  Active:     "bg-[#dcfce7] text-[#16a34a] border-0",
  Admitted:   "bg-[#eff6ff] text-[#2563eb] border-0",
  Discharged: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export function PatientListClient() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PatientListItemDTO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PatientListItemDTO | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<PaginatedData<PatientListItemDTO>>(
        `/proxy/patients?page=1&size=100`
      )
      setPatients(data.items)
    } catch (err) {
      setError("Failed to load patients")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filtered = useMemo(() => {
    return patients.filter((p) =>
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.medical_record_number.toLowerCase().includes(search.toLowerCase())
    )
  }, [patients, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  async function handleAdd(data: { mrn: string; name: string; dob: string; gender: string; phone: string; emergencyContact: string; notes: string }) {
    try {
      await apiPost(`/proxy/patients`, {
        medical_record_number: data.mrn,
        name: data.name,
        date_of_birth: data.dob || null,
        gender: data.gender || null,
        phone: data.phone || null,
        emergency_contact_phone: data.emergencyContact || null,
        note: data.notes || null,
      })
      await fetchPatients()
    } catch (err) {
      console.error("Failed to create patient:", err)
    }
  }

  async function handleEdit(data: { mrn: string; name: string; dob: string; gender: string; phone?: string; emergencyContact?: string; notes?: string }) {
    if (!editTarget) return
    try {
      await apiPatch(`/proxy/patients/${editTarget.id}`, {
        name: data.name,
        date_of_birth: data.dob || null,
        gender: data.gender || null,
        phone: data.phone || null,
        emergency_contact_phone: data.emergencyContact || null,
        note: data.notes || null,
      })
      setEditTarget(null)
      await fetchPatients()
    } catch (err) {
      console.error("Failed to update patient:", err)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/proxy/patients/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchPatients()
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "PATIENT_ADMITTED") {
        toast.error("Cannot delete: patient is currently admitted")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to delete patient")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading patients...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchPatients}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Patient List</h1>
          <p className="text-sm text-[#4b5563]">Manage patient records across all hospitals</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Patient
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-4 text-[#9ca3af] pointer-events-none" />
          <Input
            placeholder="Search patients..."
            className="pl-8 w-[300px] h-9 border-[#d1d5db]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">MRN</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">DOB</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Gender</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-[#9ca3af]">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((patient, idx) => (
                  <TableRow
                    key={patient.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3">
                      <span
                        className="text-[#2563eb] font-medium cursor-pointer hover:underline"
                        onClick={() => router.push(`/patients/measurement?mrn=${patient.medical_record_number}`)}
                      >
                        {patient.medical_record_number}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-[#111827]">{patient.name}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{patient.date_of_birth ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{patient.gender ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[patient.status]}>{patient.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => setEditTarget(patient)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(patient)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="patients"
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddPatientModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      <EditPatientModal
        key={editTarget?.id}
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        patient={editTarget ? {
          mrn: editTarget.medical_record_number,
          name: editTarget.name,
          dob: editTarget.date_of_birth ?? "",
          gender: editTarget.gender ?? "",
          phone: editTarget.phone ?? "",
          emergencyContact: editTarget.emergency_contact_phone ?? "",
          notes: editTarget.note ?? "",
        } : null}
        onSubmit={handleEdit}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Patient"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}

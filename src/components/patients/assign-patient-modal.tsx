"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet } from "@/services/api"

type AvailablePatient = {
  id: string
  mrn: string
  name: string
  dob: string
}

interface CursorPage {
  items: Array<{
    id: string
    name: string
    medical_record_number: string
    date_of_birth: string | null
    gender: string | null
  }>
  next_cursor: string | null
  has_more: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bedId: string
  wardName?: string
  onAdmit?: (patient: AvailablePatient) => void
}

export function AssignPatientModal({
  open,
  onOpenChange,
  bedId,
  wardName = "Surgery",
  onAdmit,
}: Props) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [patients, setPatients] = useState<AvailablePatient[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const nextCursorRef = useRef<string | null>(null)
  const debouncedSearchRef = useRef("")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch patients (initial or search change)
  const fetchPatients = useCallback(async (searchTerm: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "20" })
      if (searchTerm) params.set("search", searchTerm)
      const data = await apiGet<CursorPage>(`/proxy/patients/available?${params}`)
      setPatients(data.items.map((p) => ({
        id: p.id,
        mrn: p.medical_record_number,
        name: p.name,
        dob: p.date_of_birth ?? "",
      })))
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } finally {
      setLoading(false)
    }
  }, [])

  // Keep refs in sync
  nextCursorRef.current = nextCursor
  debouncedSearchRef.current = debouncedSearch

  // Fetch more patients (infinite scroll)
  const fetchMore = useCallback(async () => {
    if (!nextCursorRef.current || loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({ limit: "20", cursor: nextCursorRef.current })
      if (debouncedSearchRef.current) params.set("search", debouncedSearchRef.current)
      const data = await apiGet<CursorPage>(`/proxy/patients/available?${params}`)
      setPatients((prev) => [
        ...prev,
        ...data.items.map((p) => ({
          id: p.id,
          mrn: p.medical_record_number,
          name: p.name,
          dob: p.date_of_birth ?? "",
        })),
      ])
      setNextCursor(data.next_cursor)
      setHasMore(data.has_more)
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [])

  // Load on open & search change
  useEffect(() => {
    if (open) fetchPatients(debouncedSearch)
  }, [open, debouncedSearch, fetchPatients])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, fetchMore])

  const selectedPatient = patients.find((p) => p.id === selectedId) ?? null

  function handleAdmit() {
    if (selectedPatient) {
      onAdmit?.(selectedPatient)
      onOpenChange(false)
      resetState()
    }
  }

  function handleCancel() {
    onOpenChange(false)
    resetState()
  }

  function resetState() {
    setSelectedId(null)
    setSearch("")
    setDebouncedSearch("")
    setPatients([])
    setNextCursor(null)
    setHasMore(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[520px] p-0 gap-0 rounded-[16px] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#111827]">Assign Patient</h2>
              <p className="text-[14px] text-[#9ca3af] mt-1">
                Select a patient to admit to Bed {bedId}
              </p>
            </div>
            <DialogPrimitive.Close
              render={
                <button className="text-[16px] text-[#9ca3af] hover:text-[#6b7280] leading-none mt-1">✕</button>
              }
            />
          </div>
          {/* Bed badge */}
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-[8px] text-[13px] font-medium bg-[#eff6ff] text-[#2563eb]">
              {wardName} - Bed {bedId}
            </span>
          </div>
          <div className="border-b border-[#e5e7eb] mt-4" />
        </div>

        {/* Body */}
        <div className="px-8 py-5 space-y-4">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Search Patient</label>
            <Input
              placeholder="Search by name or MRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 border-[#d1d5db] text-[14px]"
            />
          </div>

          {/* Patient list */}
          <div>
            <p className="text-[12px] font-semibold text-[#9ca3af] mb-2">
              Available Patients (not admitted)
            </p>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
              {loading ? (
                <p className="text-[14px] text-[#9ca3af] text-center py-6">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="text-[14px] text-[#9ca3af] text-center py-6">No patients found</p>
              ) : (
                <>
                  {patients.map((patient) => {
                    const isSelected = patient.id === selectedId
                    return (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedId(patient.id)}
                        className={[
                          "w-full flex items-center gap-3 px-3 py-3 rounded-[8px] border text-left transition-colors",
                          isSelected
                            ? "bg-[#eff6ff] border-2 border-[#2563eb]"
                            : "bg-white border border-[#e5e7eb] hover:bg-[#f9fafb]",
                        ].join(" ")}
                      >
                        {/* Radio indicator */}
                        <div
                          className={[
                            "size-[18px] rounded-full border-2 flex items-center justify-center shrink-0",
                            isSelected ? "border-[#2563eb]" : "border-[#d1d5db]",
                          ].join(" ")}
                        >
                          {isSelected && (
                            <div className="size-[8px] rounded-full bg-[#2563eb]" />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-[#111827]">{patient.name}</p>
                          <p className="text-[12px] text-[#9ca3af]">
                            {patient.mrn}&nbsp;&nbsp;|&nbsp;&nbsp;DOB: {patient.dob}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                  {/* Infinite scroll sentinel */}
                  {hasMore && (
                    <div ref={observerRef} className="py-3 text-center">
                      {loadingMore && (
                        <p className="text-[13px] text-[#9ca3af]">Loading more...</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 px-6 border-[#d1d5db] text-[#4b5563] text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdmit}
            disabled={!selectedPatient}
            className="h-10 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold disabled:opacity-50"
          >
            Admit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

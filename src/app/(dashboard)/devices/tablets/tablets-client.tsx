"use client"

import { useState, useEffect, useCallback } from "react"
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
import { RegisterTabletModal } from "@/components/devices/register-tablet-modal"
import { EditTabletModal } from "@/components/devices/edit-tablet-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { statusBadgeClass } from "@/helpers/status-badge"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api"
import { toast } from "sonner"

interface TabletWithBed {
  id: string
  bed_id: string | null
  serial_number: string
  is_active: boolean
  bed_label: string | null
  room_name: string | null
  ward_name: string | null
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

interface BedOption {
  id: string
  label: string
  room_name: string
  ward_name: string
}

const STATUS_FILTERS = ["All", "Active", "Inactive"] as const
const PAGE_SIZE = 10

export function TabletsClient() {
  const [tablets, setTablets] = useState<TabletWithBed[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [beds, setBeds] = useState<BedOption[]>([])
  const [registerOpen, setRegisterOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedTablet, setSelectedTablet] = useState<TabletWithBed | null>(null)

  const fetchTablets = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const data = await apiGet<PaginatedData<TabletWithBed>>(
        `/proxy/tablets?page=${page}&size=${PAGE_SIZE}`
      )
      setTablets(data.items)
      setTotal(data.total)
    } catch {
      toast.error("Failed to load tablets")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBeds = useCallback(async () => {
    try {
      const wardsData = await apiGet<PaginatedData<{ id: string; name: string }>>(
        "/proxy/wards?page=1&size=100"
      )
      const allBeds: BedOption[] = []
      for (const ward of wardsData.items) {
        const roomsData = await apiGet<PaginatedData<{
          id: string; name: string; beds: { id: string; bed_number: number; label: string }[]
        }>>(`/proxy/wards/${ward.id}/rooms?page=1&size=100`)
        for (const room of roomsData.items) {
          for (const bed of room.beds) {
            allBeds.push({
              id: bed.id,
              label: bed.label,
              room_name: room.name,
              ward_name: ward.name,
            })
          }
        }
      }
      setBeds(allBeds)
    } catch {
      console.error("Failed to load beds")
    }
  }, [])

  useEffect(() => {
    fetchTablets(currentPage)
  }, [currentPage, fetchTablets])

  // Client-side filter (search + status)
  const filtered = tablets.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.bed_label ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Active" && t.is_active) ||
      (selectedStatus === "Inactive" && !t.is_active)
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleStatusChange(status: string) {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  async function handleRegister(data: { serial: string; secret: string; bedId: string }) {
    try {
      await apiPost("/proxy/tablets", {
        bed_id: data.bedId,
        serial_number: data.serial,
        device_secret: data.secret,
      })
      toast.success("Tablet registered")
      fetchTablets(currentPage)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message ?? "Failed to register tablet")
    }
  }

  async function handleEdit(data: { id: string; bedId: string | null; isActive: boolean; deviceSecret: string }) {
    try {
      await apiPatch(`/proxy/tablets/${data.id}`, {
        bed_id: data.bedId,
        is_active: data.isActive,
        ...(data.deviceSecret ? { device_secret: data.deviceSecret } : {}),
      })
      toast.success("Tablet updated")
      setEditOpen(false)
      fetchTablets(currentPage)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message ?? "Failed to update tablet")
    }
  }

  async function handleDelete() {
    if (!selectedTablet) return
    try {
      await apiDelete(`/proxy/tablets/${selectedTablet.id}`)
      toast.success("Tablet deactivated")
      setDeleteOpen(false)
      fetchTablets(currentPage)
    } catch {
      toast.error("Failed to delete tablet")
    }
  }

  function openEdit(tablet: TabletWithBed) {
    setSelectedTablet(tablet)
    setEditOpen(true)
    fetchBeds()
  }

  function openRegister() {
    setRegisterOpen(true)
    fetchBeds()
  }

  function openDelete(tablet: TabletWithBed) {
    setSelectedTablet(tablet)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Tablet Management</h1>
          <p className="text-sm text-[#4b5563]">Register and manage tablet devices</p>
        </div>
        <Button
          onClick={openRegister}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
        >
          + Register Tablet
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-4 text-[#9ca3af] pointer-events-none" />
          <Input
            placeholder="Search serial or bed..."
            className="pl-8 w-[300px] h-9 border-[#d1d5db]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                selectedStatus === status
                  ? "bg-[#2563eb] text-white"
                  : "bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Serial</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Bed</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ward / Room</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-[#9ca3af]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-[#9ca3af]">
                    No tablets found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tablet, idx) => {
                  const statusLabel = tablet.is_active ? "Active" : "Inactive"
                  const wardRoom = tablet.ward_name && tablet.room_name
                    ? `${tablet.ward_name} / ${tablet.room_name}`
                    : "-"
                  return (
                    <TableRow
                      key={tablet.id}
                      className={cn(
                        "border-b border-[#e5e7eb]",
                        idx % 2 === 1 ? "bg-[#fcfcfe]" : "bg-white"
                      )}
                    >
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              tablet.is_active ? "bg-[#16a34a]" : "bg-[#9ca3af]"
                            )}
                          />
                          <span className="font-medium text-[#111827]">{tablet.serial_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[#111827] text-[13px]">
                        {tablet.bed_label ?? "Unassigned"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[#4b5563] text-[13px]">{wardRoom}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={statusBadgeClass[statusLabel]}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                            onClick={() => openEdit(tablet)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                            onClick={() => openDelete(tablet)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="tablets"
          />
        </CardContent>
      </Card>

      <RegisterTabletModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        beds={beds}
        onRegister={handleRegister}
      />

      <EditTabletModal
        open={editOpen}
        onOpenChange={setEditOpen}
        tablet={selectedTablet ? {
          id: selectedTablet.id,
          serial_number: selectedTablet.serial_number,
          bed_id: selectedTablet.bed_id,
          is_active: selectedTablet.is_active,
        } : null}
        beds={beds}
        onSave={handleEdit}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Deactivate Tablet"
        targetName={selectedTablet?.serial_number ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}

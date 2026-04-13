"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { Search, Pencil, Trash2, Plus, RefreshCw, Tablet, X, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"
import dynamic from "next/dynamic"

const RegisterTabletModal = dynamic(
  () => import("@/components/devices/register-tablet-modal").then((m) => ({ default: m.RegisterTabletModal })),
  { ssr: false }
)
const EditTabletModal = dynamic(
  () => import("@/components/devices/edit-tablet-modal").then((m) => ({ default: m.EditTabletModal })),
  { ssr: false }
)
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { statusBadgeClass } from "@/helpers/status-badge"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api"
import { toast } from "sonner"

interface TabletWithBed {
  id: string
  bed_id: string | null
  serial_number: string
  is_active: boolean
  is_online: boolean
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
        "/proxy/wards?page=1&size=100&is_active=true"
      )
      const roomsResults = await Promise.all(
        wardsData.items.map((ward) =>
          apiGet<PaginatedData<{
            id: string; name: string; beds: { id: string; bed_number: number; label: string }[]
          }>>(`/proxy/wards/${ward.id}/rooms?page=1&size=100`).then((roomsData) => ({
            ward,
            roomsData,
          }))
        )
      )
      const allBeds: BedOption[] = []
      for (const { ward, roomsData } of roomsResults) {
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
  const filtered = useMemo(() => tablets.filter((t) => {
    const matchesSearch =
      search === "" ||
      t.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.bed_label ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Active" && t.is_active) ||
      (selectedStatus === "Inactive" && !t.is_active)
    return matchesSearch && matchesStatus
  }), [tablets, search, selectedStatus])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleStatusChange(status: string) {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  async function handleRegister(data: { bedId?: string }) {
    try {
      const result = await apiPost<{ serial_number: string; device_secret: string }>(
        "/proxy/tablets", data.bedId ? { bed_id: data.bedId } : {}
      )
      toast.success("Tablet registered successfully")
      fetchTablets(currentPage)
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register tablet")
      return undefined
    }
  }

  async function handleEdit(data: { id: string; bedId: string | null; isActive: boolean; resetSecret: boolean }) {
    try {
      const result = await apiPatch<{ device_secret?: string | null }>(
        `/proxy/tablets/${data.id}`, {
          bed_id: data.bedId,
          is_active: data.isActive,
          reset_secret: data.resetSecret || undefined,
        }
      )
      toast.success("Tablet updated successfully")
      if (!data.resetSecret) {
        setEditOpen(false)
        fetchTablets(currentPage)
      }
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tablet")
      return undefined
    }
  }

  async function handleDelete() {
    if (!selectedTablet) return
    try {
      await apiDelete(`/proxy/tablets/${selectedTablet.id}`)
      toast.success("Tablet deactivated")
      setDeleteOpen(false)
      fetchTablets(currentPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tablet")
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTablets(currentPage)}
            disabled={loading}
            className="size-9 border-[#d1d5db] text-[#6b7280] hover:text-[#111827] cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={openRegister}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            Register Tablet
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-[#9ca3af] pointer-events-none" />
          <Input
            placeholder="Search serial or bed..."
            className="pl-8 pr-8 w-[300px] h-9 border-[#d1d5db]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-2.5 text-[#9ca3af] hover:text-[#6b7280] cursor-pointer"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((status) => {
            const count =
              status === "All" ? tablets.length
              : status === "Active" ? tablets.filter((t) => t.is_active).length
              : tablets.filter((t) => !t.is_active).length
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                  selectedStatus === status
                    ? "bg-[#2563eb] text-white"
                    : "bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]"
                )}
              >
                {status}
                <span className={cn(
                  "ml-1.5 text-[10px]",
                  selectedStatus === status ? "text-white/70" : "text-[#9ca3af]"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Serial</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Bed</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Ward / Room</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Connection</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-[#e5e7eb]">
                    <TableCell className="px-6 py-3">
                      <div className="h-4 w-28 bg-[#e5e7eb] rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-16 bg-[#e5e7eb] rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-32 bg-[#e5e7eb] rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-5 w-16 bg-[#e5e7eb] rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="h-4 w-14 bg-[#e5e7eb] rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="size-8 bg-[#e5e7eb] rounded animate-pulse" />
                        <div className="size-8 bg-[#e5e7eb] rounded animate-pulse" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                        <Tablet className="size-6 text-[#9ca3af]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#6b7280]">No tablets found</p>
                        <p className="text-xs text-[#9ca3af] mt-1">
                          {search || selectedStatus !== "All"
                            ? "Try adjusting your search or filters"
                            : "Register a new tablet to get started"}
                        </p>
                      </div>
                      {!search && selectedStatus === "All" && (
                        <Button
                          onClick={openRegister}
                          variant="outline"
                          className="mt-1 text-[#2563eb] border-[#2563eb] hover:bg-[#eff6ff] text-xs h-8 cursor-pointer"
                        >
                          <Plus className="size-3.5 mr-1" />
                          Register Tablet
                        </Button>
                      )}
                    </div>
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
                        "border-b border-[#e5e7eb] transition-colors",
                        idx % 2 === 1 ? "bg-[#fcfcfe]" : "bg-white",
                        "hover:bg-[#f0f4ff]"
                      )}
                    >
                      <TableCell className="px-6 py-3">
                        <span className="font-medium text-[#111827]">{tablet.serial_number}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[#111827] text-[13px]">
                        {tablet.bed_label ?? "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[#4b5563] text-[13px]">{wardRoom}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={statusBadgeClass[statusLabel]}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {tablet.is_online ? (
                          <div className="flex items-center gap-1.5">
                            <Wifi className="size-3.5 text-[#16a34a]" />
                            <span className="text-[12px] font-medium text-[#16a34a]">Online</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <WifiOff className="size-3.5 text-[#9ca3af]" />
                            <span className="text-[12px] font-medium text-[#9ca3af]">Offline</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-[#2563eb] hover:text-[#1d4ed8] hover:bg-[#eff6ff] cursor-pointer"
                            onClick={() => openEdit(tablet)}
                            title="Edit tablet"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-[#dc2626] hover:text-[#b91c1c] hover:bg-[#fef2f2] cursor-pointer"
                            onClick={() => openDelete(tablet)}
                            title="Deactivate tablet"
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
        onOpenChange={(open) => { setEditOpen(open); if (!open) fetchTablets(currentPage) }}
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

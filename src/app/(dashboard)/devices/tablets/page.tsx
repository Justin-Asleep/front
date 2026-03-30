"use client"

import { useState, useMemo } from "react"
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
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { RegisterTabletModal } from "@/components/devices/register-tablet-modal"
import { EditTabletModal } from "@/components/devices/edit-tablet-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

type Status = "Active" | "Inactive"

type Tablet = {
  id: string
  serial: string
  bed: string
  wardRoom: string
  status: Status
  lastHeartbeat: string
}

const initialTablets: Tablet[] = [
  { id: "1",  serial: "TAB-001-A", bed: "Bed 101",     wardRoom: "Ward A / Room 101", status: "Active",   lastHeartbeat: "2 min ago" },
  { id: "2",  serial: "TAB-002-B", bed: "Bed 102",     wardRoom: "Ward A / Room 102", status: "Active",   lastHeartbeat: "1 min ago" },
  { id: "3",  serial: "TAB-003-C", bed: "Bed 201",     wardRoom: "Ward B / Room 201", status: "Active",   lastHeartbeat: "Just now" },
  { id: "4",  serial: "TAB-004-D", bed: "Bed 202",     wardRoom: "Ward B / Room 202", status: "Inactive", lastHeartbeat: "3 hours ago" },
  { id: "5",  serial: "TAB-005-E", bed: "Bed 301",     wardRoom: "Ward C / Room 301", status: "Active",   lastHeartbeat: "5 min ago" },
  { id: "6",  serial: "TAB-006-F", bed: "Unassigned",  wardRoom: "-",                 status: "Inactive", lastHeartbeat: "2 days ago" },
  { id: "7",  serial: "TAB-007-G", bed: "Bed 103",     wardRoom: "Ward A / Room 103", status: "Active",   lastHeartbeat: "4 min ago" },
  { id: "8",  serial: "TAB-008-H", bed: "Bed 302",     wardRoom: "Ward C / Room 302", status: "Active",   lastHeartbeat: "7 min ago" },
  { id: "9",  serial: "TAB-009-I", bed: "Bed 203",     wardRoom: "Ward B / Room 203", status: "Active",   lastHeartbeat: "5 min ago" },
  { id: "10", serial: "TAB-010-J", bed: "Bed 401",     wardRoom: "Ward D / Room 401", status: "Active",   lastHeartbeat: "1 min ago" },
  { id: "11", serial: "TAB-011-K", bed: "Bed 402",     wardRoom: "Ward D / Room 402", status: "Active",   lastHeartbeat: "3 min ago" },
  { id: "12", serial: "TAB-012-L", bed: "Unassigned",  wardRoom: "-",                 status: "Inactive", lastHeartbeat: "5 days ago" },
]

const STATUS_FILTERS = ["All", "Active", "Inactive"] as const
const PAGE_SIZE = 6

const statusBadgeClass: Record<Status, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function TabletMgmtPage() {
  const [tablets, setTablets] = useState<Tablet[]>(initialTablets)
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedTablet, setSelectedTablet] = useState<Tablet | null>(null)

  const filtered = useMemo(() => {
    return tablets.filter((t) => {
      const matchesSearch =
        search === "" ||
        t.serial.toLowerCase().includes(search.toLowerCase()) ||
        t.bed.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = selectedStatus === "All" || t.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [tablets, search, selectedStatus])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  function handleStatusChange(status: string) {
    setSelectedStatus(status)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleRegister(data: { serial: string; secret: string; bed: string }) {
    const parts = data.bed.split(" / ")
    const bed = parts[2] ?? data.bed
    const wardRoom = parts.slice(0, 2).join(" / ")
    const newTablet: Tablet = {
      id: String(Date.now()),
      serial: data.serial,
      bed,
      wardRoom,
      status: "Active",
      lastHeartbeat: "Just now",
    }
    setTablets((prev) => [newTablet, ...prev])
  }

  function handleEdit(data: { id: string; bed: string; status: Status; newSecret: string }) {
    setTablets((prev) =>
      prev.map((t) => {
        if (t.id !== data.id) return t
        const parts = data.bed.split(" / ")
        const bed = parts[2] ?? data.bed
        const wardRoom = parts.slice(0, 2).join(" / ")
        return { ...t, bed, wardRoom, status: data.status }
      })
    )
  }

  function handleDelete(id: string) {
    setTablets((prev) => prev.filter((t) => t.id !== id))
    setCurrentPage(1)
  }

  function openEdit(tablet: Tablet) {
    setSelectedTablet(tablet)
    setEditOpen(true)
  }

  function openDelete(tablet: Tablet) {
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
          onClick={() => setRegisterOpen(true)}
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
      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Serial</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Bed</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ward / Room</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Last Heartbeat</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-[#9ca3af]">
                    No tablets found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tablet, idx) => (
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
                            tablet.status === "Active" ? "bg-[#16a34a]" : "bg-[#9ca3af]"
                          )}
                        />
                        <span className="font-medium text-[#111827]">{tablet.serial}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[#111827] text-[13px]">{tablet.bed}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563] text-[13px]">{tablet.wardRoom}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[tablet.status]}>{tablet.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563] text-[13px]">{tablet.lastHeartbeat}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(tablet)}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(tablet)}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                        >
                          Delete
                        </button>
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
            label="tablets"
          />
        </CardContent>
      </Card>

      <RegisterTabletModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onRegister={handleRegister}
      />

      <EditTabletModal
        open={editOpen}
        onOpenChange={setEditOpen}
        tablet={selectedTablet}
        onSave={handleEdit}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tablet"
        targetName={selectedTablet?.serial ?? ""}
        onConfirm={() => selectedTablet && handleDelete(selectedTablet.id)}
      />
    </div>
  )
}

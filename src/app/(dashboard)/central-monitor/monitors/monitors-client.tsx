"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import type { EditMonitorData } from "@/components/central-monitor/edit-monitor-modal"

const AddMonitorModal = dynamic(
  () => import("@/components/central-monitor/add-monitor-modal").then((m) => ({ default: m.AddMonitorModal })),
  { ssr: false }
)
const EditMonitorModal = dynamic(
  () => import("@/components/central-monitor/edit-monitor-modal").then((m) => ({ default: m.EditMonitorModal })),
  { ssr: false }
)
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { statusBadgeClass } from "@/helpers/status-badge"
import { apiGet, apiPost, apiPatch, apiPut, apiDelete, ApiError } from "@/services/api"

interface AvailableBedDTO {
  id: string
  label: string
  patient_name: string | null
}

interface CursorData<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
}

interface MonitorDTO {
  id: string
  hospital_id: string
  name: string
  layout: string
  url_key: string
  is_active: boolean
}

interface MonitorBedDetailDTO {
  bed_id: string
  position: number
  bed_label: string
  patient_name: string | null
  encounter_id: string | null
}

interface MonitorDetailDTO extends MonitorDTO {
  beds: MonitorBedDetailDTO[]
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

type MonitorStatus = "Active" | "Inactive"

type Monitor = {
  id: string
  name: string
  urlKey: string
  layout: string
  status: MonitorStatus
}

export function MonitorsClient() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditMonitorData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Monitor | null>(null)

  const fetchMonitors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<PaginatedData<MonitorDTO>>(
        `/proxy/monitors?page=1&size=100`
      )
      setMonitors(
        data.items.map((m) => ({
          id: m.id,
          name: m.name,
          urlKey: m.url_key,
          layout: m.layout,
          status: m.is_active ? "Active" : "Inactive",
        }))
      )
    } catch (err) {
      setError("Failed to load monitors")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleAdd(data: { name: string; layout: string }) {
    try {
      await apiPost(`/proxy/monitors`, { name: data.name, layout: data.layout })
      setAddOpen(false)
      await fetchMonitors()
      toast.success("Monitor created successfully")
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "DUPLICATE") {
        toast.error("A monitor with this name already exists")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to create monitor")
      }
    }
  }

  async function fetchAllAvailableBeds(): Promise<AvailableBedDTO[]> {
    const all: AvailableBedDTO[] = []
    let cursor: string | null = null
    do {
      const params: string = cursor ? `?cursor=${cursor}&limit=50` : `?limit=50`
      const res = await apiGet<CursorData<AvailableBedDTO>>(`/proxy/monitors/available-beds${params}`)
      all.push(...res.items)
      cursor = res.next_cursor
    } while (cursor)
    return all
  }

  async function handleOpenEdit(monitor: Monitor) {
    try {
      const [detail, beds] = await Promise.all([
        apiGet<MonitorDetailDTO>(`/proxy/monitors/${monitor.id}`),
        fetchAllAvailableBeds(),
      ])
      const mappedBedIds = new Set(detail.beds.map((b) => b.bed_id))
      const detailMap = new Map(detail.beds.map((b) => [b.position, b]))
      const [cols, rows] = (monitor.layout.split("x").map(Number)) as [number, number]
      const totalSlots = cols * rows
      const slots = Array.from({ length: totalSlots }, (_, i) => {
        const pos = i + 1
        const mb = detailMap.get(pos)
        if (mb) {
          return { position: pos, bedId: mb.bed_id, bedLabel: mb.bed_label, patient: mb.patient_name }
        }
        return { position: pos, bedId: null, bedLabel: null, patient: null }
      })
      setEditTarget({
        id: monitor.id,
        name: monitor.name,
        urlKey: monitor.urlKey,
        layout: monitor.layout,
        status: monitor.status,
        availableBeds: beds
          .filter((b) => !mappedBedIds.has(b.id))
          .map((b) => ({ id: b.id, label: b.label, patient: b.patient_name })),
        slots,
      })
    } catch (err) {
      console.error("Failed to load monitor detail:", err)
    }
  }

  async function handleEdit(data: { name: string; layout: string; status: MonitorStatus; slots: { position: number; bedId: string | null }[] }) {
    if (!editTarget) return
    try {
      await Promise.all([
        apiPatch(`/proxy/monitors/${editTarget.id}`, {
          name: data.name,
          layout: data.layout,
          is_active: data.status === "Active",
        }),
        apiPut(`/proxy/monitors/${editTarget.id}/beds`, {
          beds: data.slots
            .filter((s) => s.bedId !== null)
            .map((s) => ({ bed_id: s.bedId, position: s.position })),
        }),
      ])
      setEditTarget(null)
      await fetchMonitors()
      toast.success("Monitor updated successfully")
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "DUPLICATE") {
        toast.error("A monitor with this name already exists")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update monitor")
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/proxy/monitors/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchMonitors()
      toast.success("Monitor deleted successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete monitor")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading monitors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchMonitors}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Monitor Registration</h1>
          <p className="text-sm text-[#4b5563]">Manage dashboard monitors and their configurations</p>
        </div>
        <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white" onClick={() => setAddOpen(true)}>
          + Add Monitor
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Layout</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">
                    No monitors found. Click &quot;+ Add Monitor&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                monitors.map((monitor, idx) => (
                  <TableRow
                    key={monitor.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3 font-medium text-[#111827]">{monitor.name}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{monitor.layout}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="bg-[#f9fafb] rounded-[6px] flex items-center justify-between px-2.5 h-7 w-[240px]">
                        <span className="font-mono text-xs text-[#374151] truncate max-w-[160px]">{monitor.urlKey}</span>
                        <button
                          onClick={() => handleCopy(monitor.id, monitor.urlKey)}
                          className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium ml-2 shrink-0"
                        >
                          {copiedId === monitor.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[monitor.status]}>{monitor.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => handleOpenEdit(monitor)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(monitor)}
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
        </CardContent>
      </Card>

      <AddMonitorModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
      />

      {editTarget && (
        <EditMonitorModal
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null) }}
          monitor={editTarget}
          onSubmit={handleEdit}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Monitor"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}

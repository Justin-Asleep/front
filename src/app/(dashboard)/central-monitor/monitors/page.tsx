"use client"

import { useState } from "react"
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
import { AddMonitorModal } from "@/components/central-monitor/add-monitor-modal"
import { EditMonitorModal, EditMonitorData } from "@/components/central-monitor/edit-monitor-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

type MonitorStatus = "Active" | "Inactive"

type Monitor = {
  id: string
  name: string
  hospital: string
  urlKey: string
  layout: string
  beds: number
  status: MonitorStatus
}

const initialMonitors: Monitor[] = [
  { id: "1", name: "ICU Monitor",    hospital: "Seoul General", urlKey: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c9e", layout: "4x2", beds: 6, status: "Active" },
  { id: "2", name: "Ward A Monitor", hospital: "Seoul General", urlKey: "b7e2f194-3c8a-4d5b-9e1f-2a3b4c5d6e3c", layout: "4x2", beds: 4, status: "Active" },
  { id: "3", name: "ER Monitor",     hospital: "Seoul General", urlKey: "d1c9a847-5f2e-4b6d-7e8f-9a0b1c2d3e5f", layout: "2x2", beds: 3, status: "Active" },
  { id: "4", name: "Ward B Monitor", hospital: "Yonsei Med",    urlKey: "e4b6d823-f1a9-4c7e-2b4d-7a3b4c5d6e2b", layout: "4x2", beds: 4, status: "Active" },
  { id: "5", name: "Rehab Monitor",  hospital: "Asan Med",      urlKey: "f2a1e956-d4b8-4c3f-7e1a-8d3b4c5d6e7f", layout: "2x2", beds: 2, status: "Inactive" },
]

const statusBadgeClass: Record<MonitorStatus, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditMonitorData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Monitor | null>(null)

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleAdd(data: { name: string; layout: string }) {
    const newMonitor: Monitor = {
      id: String(Date.now()),
      name: data.name,
      hospital: "Seoul General",
      urlKey: crypto.randomUUID(),
      layout: data.layout,
      beds: 0,
      status: "Active",
    }
    setMonitors((prev) => [...prev, newMonitor])
  }

  function handleEdit(data: { name: string; layout: string; status: MonitorStatus }) {
    if (!editTarget) return
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === editTarget.id
          ? { ...m, name: data.name, layout: data.layout, status: data.status }
          : m
      )
    )
    setEditTarget(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setMonitors((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
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

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Hospital</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Beds</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitors.map((monitor, idx) => (
                <TableRow
                  key={monitor.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{monitor.name}</TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{monitor.hospital}</TableCell>
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
                  <TableCell className="px-4 py-3 text-[#4b5563]">{monitor.beds} beds</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={statusBadgeClass[monitor.status]}>{monitor.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                        onClick={() => setEditTarget({ id: monitor.id, name: monitor.name, hospital: monitor.hospital, urlKey: monitor.urlKey, layout: monitor.layout, status: monitor.status })}
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
              ))}
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

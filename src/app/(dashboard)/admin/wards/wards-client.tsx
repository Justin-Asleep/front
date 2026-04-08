"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { AddWardModal } from "@/components/admin/add-ward-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { apiGet, apiPost, apiDelete, ApiError } from "@/services/api"

interface WardDTO {
  id: string
  hospital_id: string
  name: string
  floor: number | null
  is_active: boolean
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export function WardsClient() {
  const router = useRouter()
  const [wards, setWards] = useState<WardDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WardDTO | null>(null)

  const fetchWards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<PaginatedData<WardDTO>>(
        `/proxy/wards?page=1&size=100`
      )
      setWards(data.items)
    } catch (err) {
      setError("Failed to load wards")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  async function handleAdd(data: { name: string; floor: string }) {
    try {
      await apiPost(`/proxy/wards`, {
        name: data.name,
        floor: data.floor ? Number(data.floor) : null,
      })
      await fetchWards()
      toast.success("Ward added successfully")
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "DUPLICATE") {
        toast.error("A ward with this name already exists")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to create ward")
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/proxy/wards/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchWards()
      toast.success("Ward deleted successfully")
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "ACTIVE_ENCOUNTER_EXISTS") {
        toast.error("Cannot delete: beds have active patients admitted")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to delete ward")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading wards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchWards}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Ward Management</h1>
          <p className="text-sm text-[#4b5563]">Manage hospital wards and floors</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Ward
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Ward Name</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Floor</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Status</TableHead>
                <TableHead className="px-6 py-3 text-[12px] font-semibold text-[#9ca3af]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-8 text-center text-[#9ca3af]">
                    No wards found. Click &quot;+ Add Ward&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                wards.map((ward, idx) => (
                  <TableRow
                    key={ward.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-6 py-3 font-medium text-[#111827]">{ward.name}</TableCell>
                    <TableCell className="px-6 py-3 text-[#4b5563]">
                      {ward.floor ? `${ward.floor}F` : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <Badge className={ward.is_active
                        ? "bg-[#dcfce7] text-[#16a34a] border-0"
                        : "bg-[#f3f4f6] text-[#6b7280] border-0"
                      }>
                        {ward.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => router.push('/admin/wards/' + ward.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(ward)}
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

      <AddWardModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Ward"
        targetName={deleteTarget?.name ?? ""}
        description="All rooms, beds, and tablet mappings in this ward will also be deleted."
        onConfirm={handleDelete}
      />
    </div>
  )
}

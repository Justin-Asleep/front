"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const EditStationModal = dynamic(
  () => import("@/components/central-monitor/edit-station-modal").then((m) => ({ default: m.EditStationModal })),
  { ssr: false }
)
import { statusBadgeClass } from "@/helpers/status-badge"
import { apiGet } from "@/services/api"

interface StationDTO {
  id: string
  hospital_id: string
  ward_id: string
  name: string
  url_key: string
  is_active: boolean
}

interface WardDTO {
  id: string
  name: string
}

interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

type StationStatus = "Active" | "Inactive"

type Station = {
  id: string
  name: string
  wardId: string
  wardName: string
  urlKey: string
  status: StationStatus
}

export function StationsClient() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Station | null>(null)

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [stationData, wardData] = await Promise.all([
        apiGet<PaginatedData<StationDTO>>(
          `/proxy/monitors/stations?page=1&size=100`
        ),
        apiGet<PaginatedData<WardDTO>>(
          `/proxy/wards?page=1&size=100`
        ),
      ])
      const wardMap = new Map(wardData.items.map((w) => [w.id, w.name]))
      setStations(
        stationData.items.map((s) => ({
          id: s.id,
          name: s.name,
          wardId: s.ward_id,
          wardName: wardMap.get(s.ward_id) ?? s.ward_id,
          urlKey: s.url_key,
          status: s.is_active ? "Active" : "Inactive",
        }))
      )
    } catch (err) {
      setError("Failed to load stations")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStations()
  }, [fetchStations])

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleEdit(data: { name: string; status: StationStatus }) {
    if (!editTarget) return
    setStations((prev) =>
      prev.map((s) =>
        s.id === editTarget.id
          ? { ...s, name: data.name, status: data.status }
          : s
      )
    )
    setEditTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading stations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchStations}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Station Registration</h1>
        <p className="text-sm text-[#4b5563]">Manage nurse station displays</p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Ward</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">
                    No stations found. Stations are automatically created when a ward is added.
                  </TableCell>
                </TableRow>
              ) : (
                stations.map((station, idx) => (
                  <TableRow
                    key={station.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3 font-medium text-[#111827]">{station.name}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{station.wardName}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="bg-[#f9fafb] rounded-[6px] flex items-center justify-between px-2.5 h-7 w-[220px]">
                        <span className="font-mono text-xs text-[#374151] truncate max-w-[140px]">{station.urlKey}</span>
                        <button
                          onClick={() => handleCopy(station.id, station.urlKey)}
                          className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium ml-2 shrink-0"
                        >
                          {copiedId === station.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[station.status]}>{station.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                        onClick={() => setEditTarget(station)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editTarget && (
        <EditStationModal
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null) }}
          station={editTarget}
          onSubmit={handleEdit}
        />
      )}
    </div>
  )
}

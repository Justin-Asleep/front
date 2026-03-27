"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type UrlKeyType = "Monitor" | "Station"
type Status = "Active" | "Inactive"

type UrlKey = {
  id: string
  type: UrlKeyType
  name: string
  urlKey: string
  createdAt: string
  status: Status
}

const mockUrlKeys: UrlKey[] = [
  { id: "1", type: "Monitor", name: "ICU Monitor",          urlKey: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c9e4b", createdAt: "2026-01-15", status: "Active" },
  { id: "2", type: "Monitor", name: "Ward A Monitor",       urlKey: "b7e2f194-3c8a-4d5b-9e1f-2a3b4c5d6e3c8a", createdAt: "2026-02-01", status: "Active" },
  { id: "3", type: "Station", name: "Internal Med Station", urlKey: "c4d2e891-1b7f-4a3c-8d9e-5f6a7b8c9d1b7f", createdAt: "2026-02-10", status: "Active" },
  { id: "4", type: "Monitor", name: "ER Monitor",           urlKey: "d1c9a847-5f2e-4b6d-7e8f-9a0b1c2d3e5f2e", createdAt: "2026-02-20", status: "Active" },
  { id: "5", type: "Station", name: "Surgery Station",      urlKey: "a9f1b374-8e2c-4d5a-6b7c-8d9e0f1a2b8e2c", createdAt: "2026-03-01", status: "Active" },
  { id: "6", type: "Station", name: "ICU Station",          urlKey: "e7c3d628-4a5d-4b6c-9e0f-1a2b3c4d5e4a5d", createdAt: "2026-03-05", status: "Active" },
  { id: "7", type: "Monitor", name: "Rehab Monitor",        urlKey: "f2a1e956-8d3b-4c7e-1f2a-3b4c5d6e7f8d3b", createdAt: "2026-03-10", status: "Inactive" },
]

const TYPE_FILTERS = ["All", "Monitor", "Station"] as const

const typeBadgeClass: Record<UrlKeyType, string> = {
  Monitor: "bg-[#eff6ff] text-[#2563eb] border-0",
  Station: "bg-[#ede9fe] text-[#a78bfb] border-0",
}

const statusBadgeClass: Record<Status, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function UrlKeysPage() {
  const [selectedType, setSelectedType] = useState<string>("All")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return selectedType === "All"
      ? mockUrlKeys
      : mockUrlKeys.filter((k) => k.type === selectedType)
  }, [selectedType])

  function handleCopy(id: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">URL Key Management</h1>
        <p className="text-sm text-[#4b5563]">Manage SSE stream access keys for monitors and stations</p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2 px-3 bg-[#eff6ff] rounded-[8px] h-[40px]">
        <span className="size-2 rounded-full bg-[#2563eb] shrink-0" />
        <span className="text-[12px] text-[#2563eb]">
          URL keys provide SSE stream access. Share only with authorized devices.
        </span>
      </div>

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          {/* Toolbar: type filter pills */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-[#e5e7eb]">
            {TYPE_FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  selectedType === type
                    ? "bg-[#2563eb] text-white"
                    : "bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Type</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">URL Key</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Created</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "border-b border-[#e5e7eb]",
                    idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                  )}
                >
                  <TableCell className="px-4 py-3">
                    <Badge className={typeBadgeClass[item.type]}>{item.type}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-[#111827]">{item.name}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2 bg-[#f9fafb] rounded-[6px] px-2 py-1 w-[280px]">
                      <span className="flex-1 truncate text-sm text-[#374151] font-mono">
                        {item.urlKey}
                      </span>
                      <button
                        onClick={() => handleCopy(item.urlKey)}
                        className="text-xs text-[#2563eb] font-medium shrink-0 hover:text-[#1d4ed8]"
                      >
                        Copy
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[#4b5563]">{item.createdAt}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={statusBadgeClass[item.status]}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <button className="text-sm text-[#2563eb] font-medium hover:text-[#1d4ed8]">
                      Regen
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

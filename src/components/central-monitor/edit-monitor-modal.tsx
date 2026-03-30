"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { GripVerticalIcon } from "lucide-react"

const LAYOUT_OPTIONS = [
  { value: "2x2", label: "2 × 2 (4 beds)" },
  { value: "2x3", label: "2 × 3 (6 beds)" },
  { value: "4x2", label: "4 × 2 (8 beds)" },
  { value: "4x3", label: "4 × 3 (12 beds)" },
]

// Layout → [cols, rows]
const LAYOUT_GRID: Record<string, [number, number]> = {
  "2x2": [2, 2],
  "2x3": [2, 3],
  "4x2": [4, 2],
  "4x3": [4, 3],
}

type BedItem = {
  id: string
  patient: string | null
}

type Slot = {
  position: number
  bedId: string | null
  patient: string | null
}

export type EditMonitorData = {
  id: string
  name: string
  hospital: string
  urlKey: string
  layout: string
  status: "Active" | "Inactive"
  availableBeds?: BedItem[]
  slots?: Slot[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  monitor: EditMonitorData
  onSubmit?: (data: { name: string; layout: string; status: "Active" | "Inactive"; slots: Slot[] }) => void
}

export function EditMonitorModal({ open, onOpenChange, monitor, onSubmit }: Props) {
  const [name, setName] = useState(monitor.name)
  const [layout, setLayout] = useState(monitor.layout)
  const [active, setActive] = useState(monitor.status === "Active")
  const [copied, setCopied] = useState(false)
  const [bedSearch, setBedSearch] = useState("")
  const [dragBed, setDragBed] = useState<BedItem | null>(null)
  const [slots, setSlots] = useState<Slot[]>(
    monitor.slots ?? Array.from({ length: 8 }, (_, i) => ({ position: i + 1, bedId: null, patient: null }))
  )
  const [availableBeds] = useState<BedItem[]>(
    monitor.availableBeds ?? []
  )

  const [cols, rows] = LAYOUT_GRID[layout] ?? [4, 2]
  const totalSlots = cols * rows

  // Sync slot count when layout changes
  function handleLayoutChange(val: string | null) {
    if (!val) return
    setLayout(val)
    const [c, r] = LAYOUT_GRID[val] ?? [4, 2]
    const count = c * r
    setSlots((prev) => {
      if (count > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, (_, i) => ({
            position: prev.length + i + 1,
            bedId: null,
            patient: null,
          })),
        ]
      }
      return prev.slice(0, count).map((s, i) => ({ ...s, position: i + 1 }))
    })
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(monitor.urlKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRemoveBed(position: number) {
    setSlots((prev) =>
      prev.map((s) => (s.position === position ? { ...s, bedId: null, patient: null } : s))
    )
  }

  function handleAssignBed(bed: BedItem, position: number) {
    setSlots((prev) =>
      prev.map((s) =>
        s.position === position ? { ...s, bedId: bed.id, patient: bed.patient } : s
      )
    )
  }

  function handleSave() {
    onSubmit?.({ name, layout, status: active ? "Active" : "Inactive", slots })
    onOpenChange(false)
  }

  function handleCancel() {
    // reset
    setName(monitor.name)
    setLayout(monitor.layout)
    setActive(monitor.status === "Active")
    onOpenChange(false)
  }

  const mappedCount = slots.filter((s) => s.bedId !== null).length
  const filteredBeds = availableBeds.filter(
    (b) =>
      b.id.toLowerCase().includes(bedSearch.toLowerCase()) ||
      (b.patient ?? "").toLowerCase().includes(bedSearch.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[800px] w-full p-0 rounded-2xl overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          <div className="flex items-start justify-between">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Edit Monitor
              </DialogTitle>
              <DialogDescription className="text-[14px] text-[#9ca3af] mt-1">
                Update monitor configuration
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] hover:text-[#6b7280] text-[20px] leading-none mt-0.5"
            >
              ×
            </button>
          </div>
          <div className="mt-5 h-px bg-[#e5e7eb]" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="px-8 pt-2 pb-0">
          <TabsList variant="line" className="w-full justify-start gap-0 h-auto pb-0 bg-transparent border-b border-[#e8ebed]">
            <TabsTrigger
              value="info"
              className="px-2 py-2.5 text-[14px] rounded-none border-b-2 border-transparent data-active:border-[#2563eb] data-active:text-[#2563eb] text-[#6b737d]"
            >
              Info
            </TabsTrigger>
            <TabsTrigger
              value="bed-mapping"
              className="px-2 py-2.5 text-[14px] rounded-none border-b-2 border-transparent data-active:border-[#2563eb] data-active:text-[#2563eb] text-[#6b737d]"
            >
              Bed Mapping
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="pt-5 flex flex-col gap-5">
            {/* Monitor Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111827]">
                Monitor Name <span className="text-[#2563eb]">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-lg border-[#d1d5db] text-[14px]"
              />
            </div>

            {/* Hospital (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#9ca3af]">Hospital</label>
              <div className="h-10 bg-[#f9fafb] rounded-lg px-3 flex items-center text-[14px] text-[#4b5563]">
                {monitor.hospital}
              </div>
            </div>

            {/* Layout */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#6b737d]">
                Layout <span className="text-[#2563eb]">*</span>
              </label>
              <Select value={layout} onValueChange={handleLayoutChange}>
                <SelectTrigger className="h-10 w-full rounded-lg border-[#d6d9db] text-[14px] text-[#38404a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* URL Key (read-only + copy) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] text-[#9ca3af]">URL Key</label>
              <div className="h-10 bg-[#f9fafb] rounded-lg px-3 flex items-center justify-between">
                <span className="text-[14px] text-[#4b5563] font-mono truncate max-w-[580px]">
                  {monitor.urlKey}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8] ml-2 shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#111827]">Status</label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Badge className={active ? "bg-[#dcfce7] text-[#16a34a] border-0" : "bg-[#f3f4f6] text-[#9ca3af] border-0"}>
                  {active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-7">
              <div className="h-px bg-[#e5e7eb] mb-5" />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] text-[14px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Bed Mapping Tab */}
          <TabsContent value="bed-mapping" className="pt-5">
            <div className="flex gap-4">
              {/* Left: Available Beds */}
              <div className="w-[260px] flex flex-col gap-3 shrink-0">
                <div>
                  <p className="text-[14px] font-medium text-[#38404a]">Available Beds</p>
                  <p className="text-[12px] text-[#a1a8b2]">Drag beds to monitor slots</p>
                </div>
                <Input
                  value={bedSearch}
                  onChange={(e) => setBedSearch(e.target.value)}
                  placeholder="Search beds..."
                  className="h-8 text-[13px] border-[#e8ebed]"
                />
                <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                  {filteredBeds.length === 0 ? (
                    <p className="text-[13px] text-[#a1a8b2] py-2">No beds available</p>
                  ) : (
                    filteredBeds.map((bed) => (
                      <div
                        key={bed.id}
                        draggable
                        onDragStart={() => setDragBed(bed)}
                        onDragEnd={() => setDragBed(null)}
                        className="flex items-center gap-2 h-11 bg-white border border-[#e8ebed] rounded-lg px-2 cursor-grab active:cursor-grabbing hover:bg-[#f7faff]"
                      >
                        <GripVerticalIcon className="size-4 text-[#a1a8b2] shrink-0" />
                        <div>
                          <p className="text-[13px] font-medium text-[#38404a]">Bed {bed.id}</p>
                          <p className="text-[12px] text-[#a1a8b2]">
                            {bed.patient ?? "(Empty)"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Monitor Layout Grid */}
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <p className="text-[14px] font-medium text-[#38404a]">Monitor Layout</p>
                  <p className="text-[12px] text-[#6b737d]">
                    Layout: {layout.replace("x", " × ")} &nbsp;|&nbsp; {totalSlots} positions ({mappedCount} mapped)
                  </p>
                </div>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {slots.slice(0, totalSlots).map((slot) =>
                    slot.bedId ? (
                      <div
                        key={slot.position}
                        className="bg-[#f7faff] border border-[#bad1f5] rounded-lg p-2 flex flex-col gap-1 min-h-[96px]"
                      >
                        <p className="text-[10px] text-[#a1a8b2]">Position {slot.position}</p>
                        <p className="text-[13px] font-medium text-[#2563eb]">Bed {slot.bedId}</p>
                        <p className="text-[12px] text-[#6b737d]">{slot.patient ?? "(Empty)"}</p>
                        <button
                          onClick={() => handleRemoveBed(slot.position)}
                          className="text-[11px] text-[#f04545] hover:underline text-left mt-auto"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        key={slot.position}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragBed) {
                            handleAssignBed(dragBed, slot.position)
                            setDragBed(null)
                          }
                        }}
                        className="bg-[#fafafa] border border-dashed border-[#e8ebed] rounded-lg p-2 flex flex-col items-center justify-center gap-1 min-h-[96px] text-center"
                      >
                        <p className="text-[10px] text-[#a1a8b2]">Position {slot.position}</p>
                        <p className="text-[12px] text-[#a1a8b2]">Drop bed here</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-7 mt-5">
              <div className="h-px bg-[#e8ebed] mb-5" />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="h-10 w-[100px] border-[#e8ebed] text-[#38404a] text-[14px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-medium"
                >
                  Save Mapping
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

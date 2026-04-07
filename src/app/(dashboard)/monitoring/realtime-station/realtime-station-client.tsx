"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { apiGet } from "@/services/api"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { AlarmHistoryModal } from "@/components/monitoring/alarm-history-modal"
import { Tablet, BatteryMedium, AlertTriangle, AlertOctagon } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface StationListItem {
  id: string
  name: string
  ward_id: string
  is_active: boolean
}

interface PaginatedData<T> {
  items: T[]
  total: number
}

interface RealtimeBedVitals {
  hr: number | null
  spo2: number | null
  rr: number | null
  temp: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
}

interface SensorStatus {
  connected: boolean
  battery_level: number | null
  signal_quality: number | null
}

interface TabletStatus {
  serial_number: string
  is_active: boolean
  is_online: boolean
  last_event: string | null
  last_status: string | null
  battery: number | null
  ecg: SensorStatus | null
  spo2: SensorStatus | null
  temp: SensorStatus | null
}

interface RealtimeBed {
  position: number
  bed_id: string | null
  bed_label: string | null
  ward_name: string | null
  room_name: string | null
  patient_name: string | null
  patient_mrn: string | null
  patient_gender: string | null
  patient_age: number | null
  encounter_id: string | null
  vitals: RealtimeBedVitals | null
  tablet: TabletStatus | null
  alarm_message: string | null
}

interface StationRealtime {
  station_id: string
  station_name: string
  ward_name: string
  beds: RealtimeBed[]
}

type BedStatus = "normal" | "warning" | "critical" | "empty"

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveBedStatus(bed: RealtimeBed): BedStatus {
  if (!bed.encounter_id) return "empty"
  if (!bed.vitals) return "normal"
  if (bed.alarm_message) {
    const msg = bed.alarm_message.toLowerCase()
    if (msg.includes("critical")) return "critical"
    return "warning"
  }
  return "normal"
}

function formatBp(v: RealtimeBedVitals | null): string {
  if (!v?.bp_systolic) return "--"
  return `${Math.round(v.bp_systolic)}/${Math.round(v.bp_diastolic ?? 0)}`
}

// ── Style Maps ─────────────────────────────────────────────────────────────

const cardBg: Record<BedStatus, string> = {
  normal:   "bg-status-info-bg",
  warning:  "bg-status-warning-bg",
  critical: "bg-status-critical-bg",
  empty:    "bg-status-empty-bg",
}

const cardBorder: Record<BedStatus, string> = {
  normal:   "border border-status-info",
  warning:  "border border-status-warning",
  critical: "border-2 border-status-critical",
  empty:    "border border-dashed border-status-empty",
}

const leftBarBg: Record<BedStatus, string> = {
  normal:   "bg-status-info",
  warning:  "bg-status-warning",
  critical: "bg-status-critical",
  empty:    "bg-status-empty",
}

const bannerBg: Record<"warning" | "critical", string> = {
  warning:  "bg-status-warning",
  critical: "bg-status-critical animate-critical-pulse",
}

const defaultVitalColor: Record<string, string> = {
  hr:   "var(--vital-hr)",
  spo2: "var(--vital-spo2)",
  rr:   "var(--vital-rr)",
  temp: "var(--vital-temp)",
  bp:   "var(--vital-bp)",
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SensorBattery({ label, pct, connected }: { label: string; pct: number | null | undefined; connected: boolean | null | undefined }) {
  const isOff = !connected || pct == null
  const fillColor = isOff ? "transparent" : pct >= 60 ? "#16a34a" : pct >= 30 ? "#f97316" : "#ef4444"
  return (
    <div className="flex items-center gap-0.5">
      <span className={cn("text-[11px] font-medium", isOff ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <BatteryMedium className="size-[10px] text-muted-foreground" style={{ color: isOff ? undefined : fillColor }} />
      <span className={cn("text-[11px]", isOff ? "text-muted-foreground" : "text-muted-foreground")}>
        {isOff ? "--" : `${pct}%`}
      </span>
    </div>
  )
}

function VitalCell({ label, value, color }: { label: string; value: string | number | undefined; color: string }) {
  const displayVal = value != null ? String(value) : "--"
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-[15px] font-bold leading-none", value == null && "opacity-40")} style={{ color }}>
        {displayVal}
      </span>
    </div>
  )
}

function EmptyBedCard({ bed }: { bed: RealtimeBed }) {
  return (
    <div className={cn("rounded-[8px] min-h-[168px] overflow-hidden relative flex cursor-default", cardBorder.empty, cardBg.empty)}>
      <div className={cn("w-1 flex-shrink-0", leftBarBg.empty)} />
      <div className="flex flex-col justify-center px-3 py-3">
        <p className="text-[12px] font-medium text-muted-foreground">{bed.bed_label ?? `Position ${bed.position}`}</p>
        <p className="text-[14px] text-muted-foreground mt-1">Empty Bed</p>
      </div>
    </div>
  )
}

function OccupiedBedCard({ bed, onClick }: { bed: RealtimeBed; status: BedStatus; onClick: () => void }) {
  const status = deriveBedStatus(bed)
  const hasBanner = status === "warning" || status === "critical"
  const v = bed.vitals
  const t = bed.tablet

  const vitals: { key: string; label: string; value: string | number | undefined }[] = [
    { key: "hr",   label: "HR",   value: v?.hr != null ? Math.round(v.hr) : undefined },
    { key: "spo2", label: "SpO2", value: v?.spo2 != null ? Math.round(v.spo2) : undefined },
    { key: "rr",   label: "RR",   value: v?.rr != null ? Math.round(v.rr) : undefined },
    { key: "temp", label: "Temp", value: v?.temp != null ? v.temp.toFixed(1) : undefined },
    { key: "bp",   label: "BP",   value: v?.bp_systolic != null ? formatBp(v) : undefined },
  ]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      className={cn(
        "rounded-[8px] min-h-[168px] overflow-hidden relative flex cursor-pointer",
        "hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-shadow duration-200",
        cardBorder[status],
        cardBg[status]
      )}
    >
      <div className={cn("w-1 flex-shrink-0", leftBarBg[status])} />

      <div className="flex flex-col flex-1 min-w-0">
        {hasBanner && (
          <div className={cn("flex items-center gap-1.5 px-3 h-7 flex-shrink-0", bannerBg[status as "warning" | "critical"])}>
            {status === "critical" ? (
              <AlertOctagon className="size-3 text-white flex-shrink-0" />
            ) : (
              <AlertTriangle className="size-3 text-white flex-shrink-0" />
            )}
            <span className="text-[12px] font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={bed.alarm_message ?? ""}>
              {bed.alarm_message}
            </span>
          </div>
        )}

        <div className="flex flex-col flex-1 px-3 py-2 gap-0 min-h-0">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-foreground">{bed.bed_label}</span>
            <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">{bed.patient_mrn}</span>
          </div>

          <p className="text-[14px] font-bold text-foreground mt-0.5 leading-tight">{bed.patient_name}</p>

          <div className="h-px bg-border my-1.5" />

          <div className="grid grid-cols-5 gap-x-1">
            {vitals.map(({ key, label, value }) => (
              <VitalCell
                key={key}
                label={label}
                value={value}
                color={defaultVitalColor[key]}
              />
            ))}
          </div>

          <div className="h-px bg-border my-1.5" />

          <div className="flex items-center gap-2 mt-auto">
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Tablet className="size-[11px]" />
              <span className={cn(
                t?.battery != null && t.battery < 30 ? "text-status-critical font-bold" :
                t?.battery != null && t.battery < 60 ? "text-status-warning" :
                "text-muted-foreground"
              )}>
                {t ? `${t.serial_number} ${t.battery ?? "--"}` : "--"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SensorBattery label="ECG" pct={t?.ecg?.battery_level} connected={t?.ecg?.connected} />
              <SensorBattery label="SpO2" pct={t?.spo2?.battery_level} connected={t?.spo2?.connected} />
              <SensorBattery label="Temp" pct={t?.temp?.battery_level} connected={t?.temp?.connected} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Client Component ───────────────────────────────────────────────────────

export function RealtimeStationClient() {
  const router = useRouter()
  const [stations, setStations] = useState<StationListItem[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [realtimeData, setRealtimeData] = useState<StationRealtime | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<PaginatedData<StationListItem>>("/proxy/monitors/stations?page=1&size=100")
        setStations(data.items)
        if (data.items.length > 0) setSelectedId(data.items[0].id)
      } catch (err) {
        console.error("Failed to load stations:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fetchRealtime = useCallback(async (stationId: string) => {
    if (!stationId) return
    try {
      const data = await apiGet<StationRealtime>(`/proxy/monitors/stations/${stationId}/realtime`)
      setRealtimeData(data)
    } catch (err) {
      console.error("Failed to load station realtime:", err)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchRealtime(selectedId)
  }, [selectedId, fetchRealtime])

  const beds = realtimeData?.beds ?? []
  const occupiedCount = beds.filter((b) => b.encounter_id).length
  const occupancyPct = beds.length > 0 ? Math.round((occupiedCount / beds.length) * 100) : 0
  const alarmCount = beds.filter((b) => b.alarm_message).length
  const stationOptions = useMemo(() => stations.map((s) => ({ value: s.id, label: s.name })), [stations])

  function handleCardClick(bed: RealtimeBed) {
    if (!bed.encounter_id) return
    router.push(`/monitoring/patient-monitor?bed=${bed.bed_id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading stations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-foreground">Realtime Station</h1>
        <p className="text-[14px] text-muted-foreground">{realtimeData?.ward_name ?? "Select a station"}</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchableSelect
          value={selectedId}
          onValueChange={setSelectedId}
          options={stationOptions}
          placeholder="Select station..."
          className="h-9 w-[240px] border-[#d1d5db] text-[13px]"
        />

        <div className="flex flex-col gap-1 w-[200px]">
          <div className="flex justify-between">
            <span className="text-[12px] font-medium text-foreground">{occupiedCount}/{beds.length} occupied</span>
            <span className="text-[12px] font-medium text-status-info">{occupancyPct}%</span>
          </div>
          <div className="h-2 w-full bg-status-info-bg rounded-[4px] overflow-hidden">
            <div
              className="h-2 bg-status-info rounded-[4px]"
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setHistoryOpen(true)}
          className="ml-auto h-10 px-4 flex items-center justify-center gap-1.5 rounded-[6px] border border-border bg-white hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-colors duration-200"
        >
          <span className="text-[12px] font-medium text-status-info">Alarm History</span>
          {alarmCount > 0 && (
            <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-status-critical text-white text-[10px] font-bold leading-none">
              {alarmCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {beds.map((bed) => {
          const status = deriveBedStatus(bed)
          return status === "empty" ? (
            <EmptyBedCard key={bed.position} bed={bed} />
          ) : (
            <OccupiedBedCard
              key={bed.position}
              bed={bed}
              status={status}
              onClick={() => handleCardClick(bed)}
            />
          )
        })}
      </div>

      <AlarmHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        stationName={realtimeData?.station_name ?? ""}
        wardId={stations.find((s) => s.id === selectedId)?.ward_id}
      />
    </div>
  )
}

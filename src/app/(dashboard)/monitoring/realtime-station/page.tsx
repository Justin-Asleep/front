"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AlarmHistoryModal } from "@/components/monitoring/alarm-history-modal"
import { Tablet, BatteryMedium, AlertTriangle, AlertOctagon } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type VitalStatus = "normal" | "warning" | "critical"
type BedStatus = "normal" | "warning" | "critical" | "empty"

type Vital = { value: number | string; status: VitalStatus }

type StationBed = {
  id: string
  bed: string
  patient?: string
  patientId?: string
  hr?: Vital
  spo2?: Vital
  rr?: Vital
  temp?: Vital
  bp?: Vital
  status: BedStatus
  alarmMessage?: string
  tablet?: { id: string; battery: number }
  signals?: { ecg?: number; spo2?: number; temp?: number }
}

type Station = {
  id: string
  name: string
  beds: StationBed[]
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const stations: Station[] = [
  {
    id: "s1",
    name: "Internal Medicine Ward",
    beds: [
      {
        id: "301-1",
        bed: "Bed 301-1",
        patient: "Kim Minjun",
        patientId: "P-001234",
        hr:   { value: 72,       status: "normal" },
        spo2: { value: 98,       status: "normal" },
        rr:   { value: 16,       status: "normal" },
        temp: { value: 36.5,     status: "normal" },
        bp:   { value: "120/80", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-001", battery: 90 },
        signals: { ecg: 95, spo2: 88, temp: 72 },
      },
      {
        id: "301-2",
        bed: "Bed 301-2",
        patient: "Park Soyeon",
        patientId: "P-001235",
        hr:   { value: 88,       status: "normal" },
        spo2: { value: 95,       status: "warning" },
        rr:   { value: 20,       status: "normal" },
        temp: { value: 37.2,     status: "warning" },
        bp:   { value: "135/85", status: "normal" },
        status: "warning",
        alarmMessage: "Temp Sensor Disconnected",
        tablet: { id: "TAB-002", battery: 72 },
        signals: { ecg: 90, spo2: 82 },
      },
      {
        id: "301-3",
        bed: "Bed 301-3",
        patient: "Lee Jungho",
        patientId: "P-001236",
        hr:   { value: 65,       status: "normal" },
        spo2: { value: 99,       status: "normal" },
        rr:   { value: 14,       status: "normal" },
        temp: { value: 36.8,     status: "normal" },
        bp:   { value: "118/76", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-003", battery: 88 },
        signals: { ecg: 80, spo2: 75, temp: 65 },
      },
      {
        id: "301-4",
        bed: "Bed 301-4",
        status: "empty",
      },
      {
        id: "302-1",
        bed: "Bed 302-1",
        patient: "Choi Yuna",
        patientId: "P-001237",
        hr:   { value: 102,      status: "critical" },
        spo2: { value: 92,       status: "warning" },
        rr:   { value: 24,       status: "warning" },
        temp: { value: 38.1,     status: "warning" },
        bp:   { value: "145/92", status: "warning" },
        status: "critical",
        alarmMessage: "HR High (102 bpm) | ECG Off",
        tablet: { id: "TAB-004", battery: 85 },
        signals: { spo2: 70, temp: 60 },
      },
      {
        id: "302-2",
        bed: "Bed 302-2",
        patient: "J. Hyunwoo",
        patientId: "P-001238",
        hr:   { value: 78,       status: "normal" },
        spo2: { value: 97,       status: "normal" },
        rr:   { value: 16,       status: "normal" },
        temp: { value: 36.6,     status: "normal" },
        bp:   { value: "122/78", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-005", battery: 65 },
        signals: { ecg: 85, spo2: 78, temp: 55 },
      },
      {
        id: "302-3",
        bed: "Bed 302-3",
        patient: "Han Minji",
        patientId: "P-001239",
        hr:   { value: 70,       status: "normal" },
        spo2: { value: 98,       status: "normal" },
        rr:   { value: 15,       status: "normal" },
        temp: { value: 36.4,     status: "normal" },
        bp:   { value: "116/74", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-006", battery: 78 },
        signals: { ecg: 92, spo2: 85, temp: 70 },
      },
      {
        id: "302-4",
        bed: "Bed 302-4",
        patient: "Kang Seojun",
        patientId: "P-001240",
        hr:   { value: 74,       status: "normal" },
        spo2: { value: 97,       status: "normal" },
        rr:   { value: 17,       status: "normal" },
        temp: { value: 36.7,     status: "normal" },
        bp:   { value: "124/80", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-007", battery: 55 },
        signals: { ecg: 60, spo2: 50, temp: 45 },
      },
      {
        id: "303-1",
        bed: "Bed 303-1",
        patient: "Yoon Jiyeon",
        patientId: "P-001241",
        hr:   { value: 80,       status: "normal" },
        spo2: { value: 96,       status: "warning" },
        rr:   { value: 18,       status: "normal" },
        temp: { value: 36.8,     status: "normal" },
        bp:   { value: "128/84", status: "normal" },
        status: "warning",
        alarmMessage: "SpO2 Low (96%) | Temp Off",
        tablet: { id: "TAB-009", battery: 45 },
        signals: { ecg: 30, spo2: 22 },
      },
      {
        id: "303-2",
        bed: "Bed 303-2",
        status: "empty",
      },
      {
        id: "303-3",
        bed: "Bed 303-3",
        patient: "Shin Areum",
        patientId: "P-001242",
        hr:   { value: 68,       status: "normal" },
        spo2: { value: 99,       status: "normal" },
        rr:   { value: 14,       status: "normal" },
        temp: { value: 36.3,     status: "normal" },
        bp:   { value: "114/72", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-011", battery: 82 },
        signals: { ecg: 88, spo2: 80, temp: 68 },
      },
      {
        id: "303-4",
        bed: "Bed 303-4",
        patient: "Bae Junho",
        patientId: "P-001243",
        hr:   { value: 76,       status: "normal" },
        spo2: { value: 98,       status: "normal" },
        rr:   { value: 16,       status: "normal" },
        temp: { value: 36.5,     status: "normal" },
        bp:   { value: "120/78", status: "normal" },
        status: "normal",
        tablet: { id: "TAB-012", battery: 70 },
        signals: { ecg: 75, spo2: 70, temp: 55 },
      },
    ],
  },
]

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

function vitalColor(vitalKey: string, status: VitalStatus): string {
  if (status === "critical") return "var(--status-critical)"
  if (status === "warning")  return "var(--status-warning)"
  return defaultVitalColor[vitalKey]
}

// ── Sub-components ─────────────────────────────────────────────────────────

function VitalCell({ label, value, color }: { label: string; value: string | number | undefined; color: string }) {
  const displayVal = value != null ? String(value) : "--"
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[15px] font-bold leading-none" style={{ color }}>
        {displayVal}
      </span>
    </div>
  )
}

function SensorBattery({ label, pct }: { label: string; pct: number | undefined }) {
  const isOff = pct == null || pct === 0
  const fillColor = isOff ? "transparent" : pct! >= 60 ? "#16a34a" : pct! >= 30 ? "#f97316" : "#ef4444"
  return (
    <div className="flex items-center gap-0.5">
      <span className={cn("text-[11px] font-medium", isOff ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <BatteryMedium className={cn("size-[10px]", isOff ? "text-muted-foreground" : "text-muted-foreground")} style={{ color: isOff ? undefined : fillColor }} />
      <span className={cn("text-[11px]", isOff ? "text-muted-foreground" : "text-muted-foreground")}>
        {isOff ? "--" : `${pct}%`}
      </span>
    </div>
  )
}

function EmptyBedCard({ bed }: { bed: StationBed }) {
  return (
    <div aria-label={`${bed.bed} — unoccupied`} className={cn("rounded-[8px] min-h-[168px] overflow-hidden relative flex cursor-default", cardBorder.empty, cardBg.empty)}>
      <div className={cn("w-1 flex-shrink-0", leftBarBg.empty)} />
      <div className="flex flex-col justify-center px-3 py-3">
        <p className="text-[12px] font-medium text-muted-foreground">{bed.bed}</p>
        <p className="text-[14px] text-muted-foreground mt-1">Empty Bed</p>
      </div>
    </div>
  )
}

function OccupiedBedCard({ bed, onClick }: { bed: StationBed; onClick: () => void }) {
  const hasBanner = bed.status === "warning" || bed.status === "critical"

  const vitals: { key: string; label: string; vital: Vital | undefined }[] = [
    { key: "hr",   label: "HR",   vital: bed.hr },
    { key: "spo2", label: "SpO2", vital: bed.spo2 },
    { key: "rr",   label: "RR",   vital: bed.rr },
    { key: "temp", label: "Temp", vital: bed.temp },
    { key: "bp",   label: "BP",   vital: bed.bp },
  ]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      aria-label={`${bed.bed} - ${bed.patient}${bed.alarmMessage ? ` - ALARM: ${bed.alarmMessage}` : ""}`}
      className={cn(
        "rounded-[8px] min-h-[168px] overflow-hidden relative flex cursor-pointer",
        "hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-shadow duration-200",
        cardBorder[bed.status],
        cardBg[bed.status]
      )}
    >
      {/* Left color bar */}
      <div className={cn("w-1 flex-shrink-0", leftBarBg[bed.status])} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Alarm banner */}
        {hasBanner && (
          <div className={cn("flex items-center gap-1.5 px-3 h-7 flex-shrink-0", bannerBg[bed.status as "warning" | "critical"])}>
            {bed.status === "critical" ? (
              <AlertOctagon className="size-3 text-white flex-shrink-0" />
            ) : (
              <AlertTriangle className="size-3 text-white flex-shrink-0" />
            )}
            <span className="text-[12px] font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={bed.alarmMessage}>
              {bed.alarmMessage}
            </span>
          </div>
        )}

        <div className="flex flex-col flex-1 px-3 py-2 gap-0 min-h-0">
          {/* Header: bed name + patient ID */}
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-foreground">{bed.bed}</span>
            <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">{bed.patientId}</span>
          </div>

          {/* Patient name */}
          <p className="text-[14px] font-bold text-foreground mt-0.5 leading-tight">{bed.patient}</p>

          {/* Divider */}
          <div className="h-px bg-border my-1.5" />

          {/* Vitals row */}
          <div className="grid grid-cols-5 gap-x-1">
            {vitals.map(({ key, label, vital }) => (
              <VitalCell
                key={key}
                label={label}
                value={vital?.value}
                color={vital ? vitalColor(key, vital.status) : "var(--muted-foreground)"}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-1.5" />

          {/* Footer: tablet + sensor batteries (single row) */}
          <div className="flex items-center gap-2 mt-auto">
            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Tablet className="size-[11px]" />
              <span className={cn(
                bed.tablet && bed.tablet.battery < 30 ? "text-status-critical font-bold" :
                bed.tablet && bed.tablet.battery < 60 ? "text-status-warning" :
                "text-muted-foreground"
              )}>
                {bed.tablet ? `${bed.tablet.id} ${bed.tablet.battery}%` : "--"}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SensorBattery label="ECG"  pct={bed.signals?.ecg} />
              <SensorBattery label="SpO2" pct={bed.signals?.spo2} />
              <SensorBattery label="Temp" pct={bed.signals?.temp} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RealtimeStationPage() {
  const router = useRouter()
  const [selectedStation, setSelectedStation] = useState(stations[0])
  const [historyOpen, setHistoryOpen] = useState(false)

  const beds = selectedStation.beds
  const occupiedCount = beds.filter((b) => b.status !== "empty").length
  const occupancyPct = Math.round((occupiedCount / beds.length) * 100)
  const alarmCount = beds.filter((b) => b.status === "warning" || b.status === "critical").length

  function handleCardClick(bed: StationBed) {
    if (bed.status === "empty") return
    router.push(`/monitoring/patient-monitor?bed=${bed.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-foreground">Realtime Station</h1>
        <p className="text-[14px] text-muted-foreground">{selectedStation.name}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Station selector */}
        <div className="relative">
          <select
            value={selectedStation.id}
            onChange={(e) => {
              const s = stations.find((s) => s.id === e.target.value)
              if (s) setSelectedStation(s)
            }}
            className="h-9 w-[200px] pl-2.5 pr-7 rounded-[6px] border border-[#d1d5db] bg-white text-[13px] text-foreground appearance-none cursor-pointer outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▾</span>
        </div>

        {/* Occupancy bar */}
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

        {/* Alarm History button */}
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

      {/* Bed card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {beds.map((bed) =>
          bed.status === "empty" ? (
            <EmptyBedCard key={bed.id} bed={bed} />
          ) : (
            <OccupiedBedCard
              key={bed.id}
              bed={bed}
              onClick={() => handleCardClick(bed)}
            />
          )
        )}
      </div>

      <AlarmHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        stationName={selectedStation.name}
      />
    </div>
  )
}

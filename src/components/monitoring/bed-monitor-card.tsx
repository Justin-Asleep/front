"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, BellOff, Bell } from "lucide-react"
import type { ActiveAlarm, RealtimeBed } from "@/types/monitor"
import { EcgWaveform } from "@/components/monitoring/ecg-waveform"

// ── Animated value ────────────────────────────────────────────────────────────
// key를 value로 주면 값 변경 시 DOM이 재생성되어 애니메이션이 다시 트리거됨
function AnimatedValue({ value, className }: { value: string | number, className: string }) {
  return (
    <span key={String(value)} className={cn(className, "inline-block animate-vital-flash")}>
      {value}
    </span>
  )
}

// ── Alarm severity helpers ───────────────────────────────────────────────────
const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }
const SEVERITY_BORDER: Record<string, string> = {
  CRITICAL: "border-[#dc2626]",
  HIGH: "border-[#f97316]",
  MEDIUM: "border-[#eab308]",
  LOW: "border-[#2a2b45]",
}
const SEVERITY_BANNER_BG: Record<string, string> = {
  CRITICAL: "bg-[#dc2626]",
  HIGH: "bg-[#f97316]",
  MEDIUM: "bg-[#eab308]",
  LOW: "bg-[#2a2b45]",
}
const SEVERITY_BANNER_TEXT: Record<string, string> = {
  CRITICAL: "text-white",
  HIGH: "text-white",
  MEDIUM: "text-[#0a0b1a]",
  LOW: "text-[#808099]",
}

function getHighestAlarm(alarms: Record<string, ActiveAlarm>): { severity: string; message: string } | null {
  const entries = Object.values(alarms)
  if (entries.length === 0) return null
  const topRank = entries.reduce(
    (max, a) => Math.max(max, SEVERITY_ORDER[a.severity] ?? 0),
    -1,
  )
  const top = entries.filter((a) => (SEVERITY_ORDER[a.severity] ?? 0) === topRank)
  return {
    severity: top[0].severity,
    message: top.map((a) => a.message).join(", "),
  }
}

// ── Bed Monitor Card ──────────────────────────────────────────────────────────
export const BedMonitorCard = React.memo(function BedMonitorCard({
  bed,
  isAcked,
  onAck,
}: {
  bed: RealtimeBed
  isAcked?: boolean
  onAck?: (bed: RealtimeBed) => void
}) {
  if (!bed.encounter_id) {
    return (
      <div className="rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] border border-dashed border-[#2a2b45] flex flex-col items-center justify-center min-h-[180px] gap-2">
        <div className="w-10 h-10 rounded-full border border-dashed border-[#3b3b5c] flex items-center justify-center">
          <span className="text-[18px] text-[#3b3b5c]">—</span>
        </div>
        <p className="text-[13px] font-semibold text-[#4a4a6a]">{bed.bed_label ?? `Position ${bed.position}`}</p>
        <p className="text-[11px] text-[#3b3b5c]">Empty Bed</p>
      </div>
    )
  }

  // vitals가 null이면 센서 미연결 상태
  if (!bed.vitals) {
    return (
      <div className="rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] border border-[#2a2b45] flex flex-col items-center justify-center min-h-[180px] gap-2">
        <div className="w-10 h-10 rounded-full bg-[#1e1f35] flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#555]" />
        </div>
        <p className="text-[13px] font-semibold text-[#b2b2cc]">{bed.bed_label}</p>
        <p className="text-[11px] text-[#808099]">{bed.patient_name}</p>
        <p className="text-[10px] text-[#f87171]">No Data — Sensor Disconnected</p>
      </div>
    )
  }

  const v = bed.vitals
  const t = bed.tablet
  const alarm = getHighestAlarm(bed.active_alarms ?? {})
  const alarmSeverity = alarm?.severity ?? ""
  const isCritical = alarmSeverity === "CRITICAL"

  return (
    <div className={cn(
      "rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] overflow-hidden flex flex-col min-h-[180px] border",
      alarm ? SEVERITY_BORDER[alarmSeverity] ?? "border-[#2a2b45]" : "border-[#2a2b45]",
      isCritical && !isAcked && "animate-critical-pulse",
    )}>
      {/* Alarm banner */}
      {alarm && (
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1",
          SEVERITY_BANNER_BG[alarmSeverity],
          SEVERITY_BANNER_TEXT[alarmSeverity],
        )}>
          <AlertTriangle className="size-3 shrink-0" />
          <span className="text-[10px] font-bold truncate flex-1">{alarm.message}</span>
          {onAck && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAck(bed) }}
              aria-label={isAcked ? "Alarm silenced" : "Silence alarm"}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 transition-opacity",
                "bg-black/25 hover:bg-black/40",
                isAcked && "opacity-60",
              )}
            >
              {isAcked ? <BellOff className="size-3" /> : <Bell className="size-3" />}
              {isAcked ? "Silenced" : "Ack"}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      {/* ── Left 1: Patient Info ── */}
      <div className="flex flex-col w-[100px] shrink-0 border-r border-[#1e1f35] p-2 gap-1">
        {/* Bed label — primary identifier (간호사가 가장 먼저 스캔).
            Solid primary chip로 높은 시인성 — select 페이지 공통 accent(#2563eb)와 통일. */}
        <div className="inline-flex items-center self-start rounded-md bg-[#2563eb] px-2 py-0.5 max-w-full shadow-sm">
          <span className="text-[14px] font-bold text-white tracking-tight leading-none truncate" title={bed.bed_label ?? undefined}>
            {bed.bed_label ?? "--"}
          </span>
        </div>

        {/* Patient name — secondary identity (높은 대비) */}
        <p className="text-[13px] font-semibold text-white leading-tight truncate" title={bed.patient_name ?? undefined}>
          {bed.patient_name ?? "--"}
        </p>

        {/* Demographics — gender · age (간결) */}
        <p className="text-[10px] text-[#cbd5e1] leading-tight">
          {bed.patient_gender ?? "--"}
          {bed.patient_age != null && (
            <>
              <span className="text-[#475569] mx-0.5">·</span>
              <span>{bed.patient_age}y</span>
            </>
          )}
        </p>

        {/* Location — tertiary, 하단 */}
        <div className="mt-auto flex items-center gap-1 min-w-0 text-[9px] text-[#94a3b8] leading-tight">
          <span className="truncate">{bed.ward_name ?? "--"}</span>
          <span className="text-[#475569]">·</span>
          <span className="truncate">{bed.room_name ?? "--"}</span>
        </div>
      </div>

      {/* ── Left 2: HR + PVC ── */}
      <div className="flex flex-col w-[100px] shrink-0 border-r border-[#1e1f35]">
        <div className="flex-1 flex flex-col items-center justify-center p-2.5">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[11px] font-semibold text-[#22c55e]">HR</span>
            <span className="text-[8px] text-[#808099]">bpm</span>
          </div>
          <p className={cn("text-[42px] font-bold leading-none tracking-tight", v?.hr != null ? "text-[#22c55e]" : "text-[#333] animate-pulse")}>
            {v?.hr != null ? <AnimatedValue value={Math.round(v.hr)} className="" /> : "--"}
          </p>
          {v?.hr_range && (
            <span className="text-[9px] text-[#555] font-mono mt-1">
              {v.hr_range.low ?? "--"}-{v.hr_range.high ?? "--"}
            </span>
          )}
        </div>
        <div className="border-t border-[#1e1f35] px-2.5 py-1.5 text-center">
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-[9px] font-semibold text-[#555]">PVC</span>
            <span className="text-[7px] text-[#555]">/min</span>
          </div>
          <p className="text-[18px] font-bold leading-none text-[#555] mt-0.5">
            {v?.pvc != null ? v.pvc : "--"}
          </p>
        </div>
      </div>

      {/* ── Center: ECG + Vitals ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col min-h-[90px]">
          <div className="px-3 pt-2">
            <span className="text-[10px] font-semibold text-[#4ade80]">ECG</span>
          </div>
          <div className="flex-1 flex items-center px-2">
            <EcgWaveform
              samples={bed.ecg?.samples}
              totalReceived={bed.ecg?.total_received}
              />
          </div>
        </div>

        <div className="flex border-t border-[#1e1f35]">
          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#fbbf24]">RESP</span>
              <span className="text-[7px] text-[#555]">/min</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.rr != null ? "text-[#fbbf24]" : "text-[#333] animate-pulse")}>
              {v?.rr != null ? <AnimatedValue value={Math.round(v.rr)} className="" /> : "--"}
            </p>
          </div>

          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#38bdf8]">SpO2</span>
              <span className="text-[7px] text-[#555]">%</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.spo2 != null ? "text-[#38bdf8]" : "text-[#333] animate-pulse")}>
              {v?.spo2 != null ? <AnimatedValue value={Math.round(v.spo2)} className="" /> : "--"}
            </p>
          </div>

          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#a78bfb]">Temp</span>
              <span className="text-[7px] text-[#555]">°C</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.temp != null ? "text-[#a78bfb]" : "text-[#333] animate-pulse")}>
              {v?.temp != null ? <AnimatedValue value={v.temp.toFixed(1)} className="" /> : "--"}
            </p>
          </div>

          <div className="flex-1 px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#f87171]">NBP</span>
              <span className="text-[7px] text-[#555]">mmHg</span>
            </div>
            <p className={cn("text-[16px] font-bold leading-none mt-0.5", v?.bp_systolic != null ? "text-[#f87171]" : "text-[#333] animate-pulse")}>
              {v?.bp_systolic != null
                ? <AnimatedValue value={`${Math.round(v.bp_systolic)}/${Math.round(v.bp_diastolic ?? 0)}`} className="" />
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: EWS + Device Status ── */}
      <div className="flex flex-col w-[80px] shrink-0 border-l border-[#1e1f35]">
        <div className="flex flex-col items-center justify-center border-b border-[#1e1f35] px-2 py-1.5">
          <span className="text-[9px] font-semibold text-[#555] mb-0.5">EWS</span>
          <p className="text-[22px] font-bold leading-none text-[#555]">
            {v?.ews != null ? v.ews : "--"}
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-1 p-2">
          <div className="flex items-center gap-1">
            <span className={cn(
              "w-2 h-2 rounded-full",
              t?.is_online ? "bg-[#22c55e]" : "bg-[#555]"
            )} />
            <span className="text-[9px] text-[#808099]">
              {t ? (t.is_online ? "Online" : "Offline") : "--"}
            </span>
          </div>
          {t?.battery != null && (
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#808099]">
                <rect x="1" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="23" y1="10" x2="23" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[8px] text-[#808099]">{t.battery}%</span>
            </div>
          )}
          <div className="w-full border-t border-[#1e1f35] my-0.5" />
          {[
            { label: "ECG", s: t?.ecg },
            { label: "SpO2", s: t?.spo2 },
            { label: "Temp", s: t?.temp },
          ].map(({ label, s }) => (
            <div key={label} className="flex items-center justify-between w-full px-0.5">
              <span className={cn("text-[8px]", s?.connected ? "text-[#808099]" : "text-[#444]")}>{label}</span>
              <span className={cn("text-[8px]", s?.connected ? "text-[#808099]" : "text-[#444]")}>
                {s?.connected ? `${s.battery_level ?? "--"}%` : "--"}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
})

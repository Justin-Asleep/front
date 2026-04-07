"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { RealtimeBed } from "@/types/monitor"

// ── ECG Waveform ──────────────────────────────────────────────────────────────
function EcgWaveform({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 476 60" className={cn("w-full", className)} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.5"
        points="0,30 40,30 50,30 55,28 60,30 70,30 75,30 80,10 85,50 90,5 95,55 100,30 110,30 150,30 160,30 165,28 170,30 180,30 185,30 190,10 195,50 200,5 205,55 210,30 220,30 260,30 270,30 275,28 280,30 290,30 295,30 300,10 305,50 310,5 315,55 320,30 330,30 370,30 380,30 385,28 390,30 400,30 405,30 410,10 415,50 420,5 425,55 430,30 440,30 476,30"
      />
    </svg>
  )
}

// ── Bed Monitor Card ──────────────────────────────────────────────────────────
export const BedMonitorCard = React.memo(function BedMonitorCard({ bed }: { bed: RealtimeBed }) {
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

  return (
    <div className="rounded-lg shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] bg-[#0a0b1a] overflow-hidden flex min-h-[180px]">
      {/* ── Left 1: Patient Info ── */}
      <div className="flex flex-col w-[100px] shrink-0 border-r border-[#1e1f35] p-2.5">
        <p className="text-[10px] text-[#808099] truncate">{bed.ward_name ?? "--"}</p>
        <p className="text-[10px] text-[#808099] truncate">{bed.room_name ?? "--"}</p>
        <p className="text-[12px] font-bold text-[#b2b2cc] leading-tight truncate mb-1">{bed.bed_label ?? "--"}</p>
        <p className="text-[11px] font-semibold text-[#b2b2cc] truncate">{bed.patient_name ?? "--"}</p>
        <p className="text-[9px] text-[#808099]">
          {bed.patient_gender ?? "--"} / {bed.patient_age != null ? `${bed.patient_age}세` : "--"}
        </p>
      </div>

      {/* ── Left 2: HR + PVC ── */}
      <div className="flex flex-col w-[100px] shrink-0 border-r border-[#1e1f35]">
        <div className="flex-1 flex flex-col items-center justify-center p-2.5">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[11px] font-semibold text-[#22c55e]">HR</span>
            <span className="text-[8px] text-[#808099]">bpm</span>
          </div>
          <p className={cn("text-[42px] font-bold leading-none tracking-tight", v?.hr != null ? "text-[#22c55e]" : "text-[#333] animate-pulse")}>
            {v?.hr != null ? Math.round(v.hr) : "--"}
          </p>
          {v?.hr_range && (
            <span className="text-[9px] text-[#555] font-mono mt-1">
              {v.hr_range.low ?? "--"}-{v.hr_range.high ?? "--"}
            </span>
          )}
        </div>
        <div className="border-t border-[#1e1f35] px-2.5 py-1.5 text-center">
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-[9px] font-semibold text-white">PVC</span>
            <span className="text-[7px] text-[#555]">/min</span>
          </div>
          <p className="text-[18px] font-bold leading-none text-white mt-0.5">
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
            <EcgWaveform className="h-[60px]" />
          </div>
        </div>

        <div className="flex border-t border-[#1e1f35]">
          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#fbbf24]">RESP</span>
              <span className="text-[7px] text-[#555]">/min</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.rr != null ? "text-[#fbbf24]" : "text-[#333] animate-pulse")}>
              {v?.rr != null ? Math.round(v.rr) : "--"}
            </p>
          </div>

          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#38bdf8]">SpO2</span>
              <span className="text-[7px] text-[#555]">%</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.spo2 != null ? "text-[#38bdf8]" : "text-[#333] animate-pulse")}>
              {v?.spo2 != null ? Math.round(v.spo2) : "--"}
            </p>
          </div>

          <div className="flex-1 border-r border-[#1e1f35] px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#a78bfb]">Temp</span>
              <span className="text-[7px] text-[#555]">°C</span>
            </div>
            <p className={cn("text-[18px] font-bold leading-none mt-0.5", v?.temp != null ? "text-[#a78bfb]" : "text-[#333] animate-pulse")}>
              {v?.temp != null ? v.temp.toFixed(1) : "--"}
            </p>
          </div>

          <div className="flex-1 px-1.5 py-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[9px] font-semibold text-[#f87171]">NBP</span>
              <span className="text-[7px] text-[#555]">mmHg</span>
            </div>
            <p className={cn("text-[16px] font-bold leading-none mt-0.5", v?.bp_systolic != null ? "text-[#f87171]" : "text-[#333] animate-pulse")}>
              {v?.bp_systolic != null
                ? `${Math.round(v.bp_systolic)}/${Math.round(v.bp_diastolic ?? 0)}`
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: EWS + Device Status ── */}
      <div className="flex flex-col w-[80px] shrink-0 border-l border-[#1e1f35]">
        <div className="flex flex-col items-center justify-center border-b border-[#1e1f35] px-2 py-1.5">
          <span className="text-[9px] font-semibold text-[#fb923c] mb-0.5">EWS</span>
          <p className="text-[22px] font-bold leading-none text-[#fb923c]">
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
  )
})

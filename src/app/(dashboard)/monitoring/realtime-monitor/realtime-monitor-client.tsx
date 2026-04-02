"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type VitalSign = {
  label: string
  value: string
  unit: string
  color: string
}

type BedData = {
  id: string
  bed: string
  patient: string
  vitals: VitalSign[]
  hasAlarm?: boolean
}

type Monitor = {
  id: string
  name: string
  beds: BedData[]
}

const monitors: Monitor[] = [
  {
    id: "m1",
    name: "ICU Monitor",
    beds: [
      {
        id: "1", bed: "Bed 301-1", patient: "Kim Minjun",
        vitals: [
          { label: "HR", value: "72", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "98", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "16", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "36.5", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "120/80", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
      {
        id: "2", bed: "Bed 301-2", patient: "Park Soyeon",
        vitals: [
          { label: "HR", value: "88", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "95", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "20", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "37.2", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "135/85", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
      {
        id: "3", bed: "Bed 301-3", patient: "Lee Jungho",
        vitals: [
          { label: "HR", value: "65", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "99", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "14", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "36.8", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "118/76", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
      {
        id: "4", bed: "Bed 302-1", patient: "Choi Yuna", hasAlarm: true,
        vitals: [
          { label: "HR", value: "102", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "92", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "24", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "38.1", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "145/92", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
    ],
  },
  {
    id: "m2",
    name: "Ward A Monitor",
    beds: [
      {
        id: "5", bed: "Bed 401-1", patient: "Hwang Jiwoo",
        vitals: [
          { label: "HR", value: "68", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "99", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "15", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "36.4", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "116/74", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
      {
        id: "6", bed: "Bed 401-2", patient: "Son Minji",
        vitals: [
          { label: "HR", value: "74", unit: "bpm", color: "text-[#22c55e]" },
          { label: "SpO2", value: "97", unit: "%", color: "text-[#38bdf8]" },
          { label: "RR", value: "16", unit: "/min", color: "text-[#fbbf24]" },
          { label: "Temp", value: "36.6", unit: "C", color: "text-[#a78bfb]" },
          { label: "BP", value: "122/78", unit: "mmHg", color: "text-[#f87171]" },
        ],
      },
    ],
  },
]

function EcgWaveform() {
  return (
    <div className="bg-[#111221] rounded-lg p-3 mt-auto">
      <p className="text-[#4ade80] text-[10px] font-semibold mb-1">ECG</p>
      <svg viewBox="0 0 476 60" className="w-full h-[60px]" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.5"
          points="0,30 40,30 50,30 55,28 60,30 70,30 75,30 80,10 85,50 90,5 95,55 100,30 110,30 150,30 160,30 165,28 170,30 180,30 185,30 190,10 195,50 200,5 205,55 210,30 220,30 260,30 270,30 275,28 280,30 290,30 295,30 300,10 305,50 310,5 315,55 320,30 330,30 370,30 380,30 385,28 390,30 400,30 405,30 410,10 415,50 420,5 425,55 430,30 440,30 476,30"
        />
      </svg>
    </div>
  )
}

export function RealtimeMonitorClient() {
  const [selected, setSelected] = useState(monitors[0])

  return (
    <div className="-m-6 p-6 min-h-full bg-[#f9fafb]">
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Realtime Monitor</h1>
        <p className="text-sm text-[#4b5563]">{selected.name} - {selected.beds.length} beds connected</p>
      </div>

      {/* Monitor selector */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <select
            value={selected.id}
            onChange={(e) => {
              const m = monitors.find((m) => m.id === e.target.value)
              if (m) setSelected(m)
            }}
            className="h-9 w-[200px] pl-2.5 pr-7 rounded-lg border border-[#d1d5db] bg-white text-[13px] text-[#4b5563] appearance-none cursor-pointer outline-none"
          >
            {monitors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#a1a8b2]">▾</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs text-[#16a34a]">{selected.beds.length} beds connected</span>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-5">
        {selected.beds.map((bed) => (
          <div
            key={bed.id}
            className="bg-[#1a1b2e] rounded-xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.2)] p-4 flex flex-col min-h-[320px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-semibold text-[#b2b2cc]">{bed.bed}</p>
              {bed.hasAlarm && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
              )}
            </div>
            <p className="text-base font-bold text-white mb-4">{bed.patient}</p>

            {/* Vitals */}
            <div className="flex items-start gap-6 mb-4">
              {bed.vitals.map((vital) => (
                <div key={vital.label}>
                  <p className="text-[10px] font-semibold text-[#808099] mb-1">{vital.label}</p>
                  <p className={cn("text-[28px] font-bold leading-none", vital.color)}>
                    {vital.value}
                  </p>
                  <p className="text-[10px] text-[#808099] mt-1">{vital.unit}</p>
                </div>
              ))}
            </div>

            {/* ECG */}
            <EcgWaveform />
          </div>
        ))}
      </div>
    </div>
  )
}

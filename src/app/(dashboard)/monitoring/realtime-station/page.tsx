"use client"

import { cn } from "@/lib/utils"

type BedStatus = "normal" | "warning" | "alarm" | "empty"

type StationBed = {
  id: string
  bed: string
  patient?: string
  hr?: number
  spo2?: number
  status: BedStatus
}

const mockBeds: StationBed[] = [
  { id: "1",  bed: "Bed 301-1", patient: "Kim Minjun",    hr: 72,  spo2: 98, status: "normal" },
  { id: "2",  bed: "Bed 301-2", patient: "Park Soyeon",   hr: 88,  spo2: 95, status: "warning" },
  { id: "3",  bed: "Bed 301-3", patient: "Lee Jungho",    hr: 65,  spo2: 99, status: "normal" },
  { id: "4",  bed: "Bed 301-4", status: "empty" },
  { id: "5",  bed: "Bed 302-1", patient: "Choi Yuna",     hr: 102, spo2: 92, status: "alarm" },
  { id: "6",  bed: "Bed 302-2", patient: "Jung Hyunwoo",  hr: 78,  spo2: 97, status: "normal" },
  { id: "7",  bed: "Bed 302-3", patient: "Han Minji",     hr: 70,  spo2: 98, status: "normal" },
  { id: "8",  bed: "Bed 302-4", patient: "Kang Seojun",   hr: 74,  spo2: 97, status: "normal" },
  { id: "9",  bed: "Bed 303-1", patient: "Yoon Jiyeon",   hr: 80,  spo2: 96, status: "warning" },
  { id: "10", bed: "Bed 303-2", status: "empty" },
  { id: "11", bed: "Bed 303-3", patient: "Shin Areum",    hr: 68,  spo2: 99, status: "normal" },
  { id: "12", bed: "Bed 303-4", patient: "Bae Junho",     hr: 76,  spo2: 98, status: "normal" },
]

const borderColors: Record<BedStatus, string> = {
  normal:  "border-l-[#16a34a]",
  warning: "border-l-[#f59e0b]",
  alarm:   "border-l-[#ef4444]",
  empty:   "border-l-[#d1d5db]",
}

const borderOutline: Record<BedStatus, string> = {
  normal:  "border-[#16a34a]",
  warning: "border-[#f59e0b]",
  alarm:   "border-[#ef4444]",
  empty:   "border-[#d1d5db]",
}

const bgColors: Record<BedStatus, string> = {
  normal:  "bg-white",
  warning: "bg-[#fffdf0]",
  alarm:   "bg-[#fef2f2]",
  empty:   "bg-[#f4f5f7]",
}

const dotColors: Record<BedStatus, string> = {
  normal:  "bg-[#16a34a]",
  warning: "bg-[#f59e0b]",
  alarm:   "bg-[#ef4444]",
  empty:   "bg-[#d1d5db]",
}

const statusLabel: Record<BedStatus, { text: string; color: string }> = {
  normal:  { text: "Normal",  color: "text-[#16a34a] font-medium" },
  warning: { text: "WARNING", color: "text-[#f59e0b] font-bold" },
  alarm:   { text: "ALARM",   color: "text-[#ef4444] font-bold" },
  empty:   { text: "",        color: "" },
}

export default function RealtimeStationPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Realtime Station</h1>
        <p className="text-sm text-[#4b5563]">Internal Medicine - 12 beds</p>
      </div>

      {/* Station header */}
      <div className="flex items-center gap-3">
        <p className="text-[15px] font-semibold text-[#111827]">Internal Medicine Station</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs text-[#16a34a]">12 beds</span>
        </div>
      </div>

      {/* 4x3 Grid */}
      <div className="grid grid-cols-4 gap-4">
        {mockBeds.map((bed) => (
          <div
            key={bed.id}
            className={cn(
              "rounded-[10px] border shadow-sm overflow-hidden h-[140px]",
              borderOutline[bed.status],
              bgColors[bed.status],
              bed.status === "alarm" && "shadow-[0px_2px_8px_0px_rgba(239,68,68,0.15)]"
            )}
          >
            <div className={cn("h-full border-l-[3px]", borderColors[bed.status])}>
              <div className="p-3 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <p className={cn(
                    "text-xs font-semibold",
                    bed.status === "empty" ? "text-[#9ca3af]" : "text-[#111827]"
                  )}>
                    {bed.bed}
                  </p>
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColors[bed.status])} />
                </div>

                {bed.status === "empty" ? (
                  <p className="text-[13px] text-[#9ca3af] mt-6">Empty Bed</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#111827] mb-3">{bed.patient}</p>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                        <span className="text-[13px] font-bold text-[#22c55e]">HR: {bed.hr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] flex-shrink-0" />
                        <span className="text-[13px] font-bold text-[#38bdf8]">SpO2: {bed.spo2}%</span>
                      </div>
                    </div>

                    <p className={cn("text-[11px] mt-auto", statusLabel[bed.status].color)}>
                      {statusLabel[bed.status].text}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

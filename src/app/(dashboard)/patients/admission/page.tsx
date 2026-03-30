"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewDetailModal } from "@/components/patients/view-detail-modal";
import { AssignPatientModal } from "@/components/patients/assign-patient-modal";

type BedStatus = "occupied" | "alarm" | "empty";

interface BedData {
  id: string;
  status: BedStatus;
  patient?: string;
  since?: string;
}

const BEDS: BedData[] = [
  { id: "301-1", status: "occupied", patient: "Kim Jinho", since: "2026-03-20" },
  { id: "301-2", status: "alarm", patient: "Yoon Taehyun", since: "2026-03-15" },
  { id: "301-3", status: "occupied", patient: "Lee Sooyeon", since: "2026-03-18" },
  { id: "301-4", status: "empty" },
  { id: "302-1", status: "occupied", patient: "Park Minjun", since: "2026-03-22" },
  { id: "302-2", status: "empty" },
  { id: "302-3", status: "alarm", patient: "Shin Eunji", since: "2026-03-20" },
  { id: "302-4", status: "occupied", patient: "Choi Yuna", since: "2026-03-19" },
  { id: "303-1", status: "occupied", patient: "Jung Hyunsoo", since: "2026-03-21" },
  { id: "303-2", status: "empty" },
  { id: "303-3", status: "occupied", patient: "Han Mirae", since: "2026-03-17" },
  { id: "303-4", status: "alarm", patient: "Bae Junghoon", since: "2026-03-16" },
  { id: "304-1", status: "empty" },
  { id: "304-4", status: "occupied", patient: "Oh Seungwoo", since: "2026-03-23" },
  { id: "304-3", status: "empty" },
];

const AVAILABLE_PATIENTS = [
  { mrn: "P-001237", name: "Choi Yuna",    dob: "1995-08-19" },
  { mrn: "P-001239", name: "Han Minji",    dob: "1988-07-14" },
  { mrn: "P-001240", name: "Kang Seojun",  dob: "1973-12-05" },
  { mrn: "P-001241", name: "Yoon Jiyeon",  dob: "2001-04-22" },
  { mrn: "P-001242", name: "Shin Areum",   dob: "1992-06-15" },
];

export default function AdmissionPage() {
  const [ward, setWard] = useState<string | null>("ward3");

  // Modal state
  const [viewBed, setViewBed] = useState<BedData | null>(null);
  const [assignBedId, setAssignBedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admission Management</h1>
        <p className="text-muted-foreground">
          Manage bed assignments and patient admissions by ward
        </p>
      </div>

      {/* Ward Select + 통계카드 */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={ward} onValueChange={setWard}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ward1">Ward 1 - Cardiology</SelectItem>
            <SelectItem value="ward2">Ward 2 - Neurology</SelectItem>
            <SelectItem value="ward3">Ward 3 - General Surgery</SelectItem>
            <SelectItem value="ward4">Ward 4 - Orthopedics</SelectItem>
          </SelectContent>
        </Select>

        {/* Total Beds */}
        <div className="flex w-[180px] h-[70px] rounded-[10px] shadow-sm bg-white border border-gray-100 overflow-hidden">
          <div className="w-1 bg-[#2563eb] flex-shrink-0" />
          <div className="flex flex-col justify-center px-4">
            <span className="text-[26px] font-bold text-[#2563eb] leading-tight">32</span>
            <span className="text-[11px] text-[#9ca3af]">Total Beds</span>
          </div>
        </div>

        {/* Occupied */}
        <div className="flex w-[180px] h-[70px] rounded-[10px] shadow-sm bg-white border border-gray-100 overflow-hidden">
          <div className="w-1 bg-[#16a34a] flex-shrink-0" />
          <div className="flex flex-col justify-center px-4">
            <span className="text-[26px] font-bold text-[#16a34a] leading-tight">24</span>
            <span className="text-[11px] text-[#9ca3af]">Occupied</span>
          </div>
        </div>

        {/* Available */}
        <div className="flex w-[180px] h-[70px] rounded-[10px] shadow-sm bg-white border border-gray-100 overflow-hidden">
          <div className="w-1 bg-[#f97316] flex-shrink-0" />
          <div className="flex flex-col justify-center px-4">
            <span className="text-[26px] font-bold text-[#f97316] leading-tight">8</span>
            <span className="text-[11px] text-[#9ca3af]">Available</span>
          </div>
        </div>
      </div>

      <h2 className="text-[15px] font-semibold text-[#111827]">Bed Grid - Ward 3</h2>

      {/* 4열 병상 그리드 */}
      <div className="grid grid-cols-4 gap-4">
        {BEDS.map((bed) => {
          if (bed.status === "occupied") {
            return (
              <div
                key={bed.id}
                className="w-full min-h-[120px] rounded-xl bg-[#f2f6fe] border border-[#c7d1fa] relative p-3 flex flex-col justify-between"
                style={{ borderLeftWidth: "3px", borderLeftColor: "#2563eb" }}
              >
                <div>
                  <p className="text-[13px] font-semibold text-[#2563eb]">{bed.id}</p>
                  <p className="text-[14px] font-semibold text-[#111827] mt-0.5">{bed.patient}</p>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">Since: {bed.since}</p>
                </div>
                <button
                  className="text-xs bg-[#eff6ff] text-[#2563eb] rounded-[5px] px-2 py-1 w-fit mt-2"
                  onClick={() => setViewBed(bed)}
                >
                  View Detail
                </button>
              </div>
            );
          }

          if (bed.status === "alarm") {
            return (
              <div
                key={bed.id}
                className="w-full min-h-[120px] rounded-xl bg-[#fef2f2] border border-[#ef4444] relative p-3 flex flex-col justify-between shadow-[0px_2px_8px_rgba(239,68,68,0.1)]"
                style={{ borderLeftWidth: "3px", borderLeftColor: "#ef4444" }}
              >
                <div className="absolute top-3 right-3 w-[10px] h-[10px] rounded-full bg-[#ef4444]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#ef4444]">{bed.id}</p>
                  <p className="text-[14px] font-semibold text-[#111827] mt-0.5">{bed.patient}</p>
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">Since: {bed.since}</p>
                </div>
                <button
                  className="text-xs bg-[#fef2f2] text-[#ef4444] border border-[#ef4444] rounded-[5px] px-2 py-1 w-fit mt-2"
                  onClick={() => setViewBed(bed)}
                >
                  View Detail
                </button>
              </div>
            );
          }

          // empty
          return (
            <div
              key={bed.id}
              className="w-full min-h-[120px] rounded-xl bg-[#f4f5f7] border border-dashed border-[#d1d5db] p-3 flex flex-col justify-between"
            >
              <div>
                <p className="text-[13px] font-semibold text-[#9ca3af]">{bed.id}</p>
                <p className="text-[14px] text-[#9ca3af] mt-0.5">Empty</p>
              </div>
              <button
                className="text-xs bg-white border border-[#d1d5db] text-[#4b5563] rounded-[6px] px-2 py-1 w-fit mt-2"
                onClick={() => setAssignBedId(bed.id)}
              >
                Assign Patient
              </button>
            </div>
          );
        })}
      </div>

      {/* 하단 범례 */}
      <div className="flex items-center gap-6 text-xs text-[#6b7280]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span>Alarm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#9ca3af]" />
          <span>Empty</span>
        </div>
      </div>

      {/* Modals */}
      <ViewDetailModal
        open={viewBed !== null}
        onOpenChange={(open) => { if (!open) setViewBed(null); }}
        patient={viewBed ? {
          mrn: "P-001234",
          name: viewBed.patient ?? "",
          gender: "Male",
          admittedDate: viewBed.since ?? "2026-03-20",
          bed: viewBed.id,
          ward: "Surgery Ward",
          room: "Room 301",
          attending: "Dr. Park Jihoon",
          status: viewBed.status === "alarm" ? "Warning" : "Normal",
          vitals: { hr: 72, spo2: 98, rr: 16, temp: 36.5, bp: "120/80" },
          vitalsUpdated: "Updated 5 min ago",
          alarmNote: viewBed.status === "alarm" ? "Active alarm" : "No active alarms",
        } : null}
      />

      <AssignPatientModal
        open={assignBedId !== null}
        onOpenChange={(open) => { if (!open) setAssignBedId(null); }}
        bedId={assignBedId ?? ""}
        wardName="Surgery"
        availablePatients={AVAILABLE_PATIENTS}
      />
    </div>
  );
}

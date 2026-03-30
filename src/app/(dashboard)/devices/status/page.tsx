"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────

type SensorStatus = "connected" | "disconnected"
type DeviceStatus = "Online" | "Offline"
type Ward = "Internal Med" | "Surgery" | "ICU" | "Emergency"
type Network = "WiFi" | "LTE"

type SensorDetail = {
  status: SensorStatus
  signalPct?: number // 0–100; absent for BP (shows "OK" instead)
}

type Device = {
  id: string
  serial: string
  location: string
  ward: Ward
  status: DeviceStatus
  battery: number     // 0–100
  network: Network
  sensors: {
    ecg: SensorDetail
    spo2: SensorDetail
    temp: SensorDetail
    bp: SensorDetail
  }
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockDevices: Device[] = [
  {
    id: "1", serial: "TAB-001", location: "Bed 101 - Room 101", ward: "Internal Med",
    status: "Online", battery: 90, network: "WiFi",
    sensors: { ecg: { status: "connected", signalPct: 92 }, spo2: { status: "connected", signalPct: 85 }, temp: { status: "connected", signalPct: 78 }, bp: { status: "connected" } },
  },
  {
    id: "2", serial: "TAB-002", location: "Bed 102 - Room 102", ward: "Internal Med",
    status: "Online", battery: 72, network: "WiFi",
    sensors: { ecg: { status: "connected", signalPct: 88 }, spo2: { status: "connected", signalPct: 80 }, temp: { status: "disconnected" }, bp: { status: "connected" } },
  },
  {
    id: "3", serial: "TAB-003", location: "Bed 201 - Room 201", ward: "Surgery",
    status: "Online", battery: 35, network: "LTE",
    sensors: { ecg: { status: "connected", signalPct: 76 }, spo2: { status: "connected", signalPct: 70 }, temp: { status: "connected", signalPct: 65 }, bp: { status: "disconnected" } },
  },
  {
    id: "4", serial: "TAB-005", location: "Bed 301 - Room 301", ward: "ICU",
    status: "Online", battery: 85, network: "WiFi",
    sensors: { ecg: { status: "connected", signalPct: 95 }, spo2: { status: "connected", signalPct: 90 }, temp: { status: "connected", signalPct: 82 }, bp: { status: "connected" } },
  },
  {
    id: "5", serial: "TAB-007", location: "Bed 103 - Room 103", ward: "Internal Med",
    status: "Online", battery: 18, network: "WiFi",
    sensors: { ecg: { status: "disconnected" }, spo2: { status: "connected", signalPct: 72 }, temp: { status: "connected", signalPct: 68 }, bp: { status: "connected" } },
  },
  {
    id: "6", serial: "TAB-009", location: "Bed 203 - Room 203", ward: "Surgery",
    status: "Online", battery: 60, network: "LTE",
    sensors: { ecg: { status: "connected", signalPct: 84 }, spo2: { status: "connected", signalPct: 79 }, temp: { status: "connected", signalPct: 71 }, bp: { status: "connected" } },
  },
  {
    id: "7", serial: "TAB-011", location: "Bed 302 - Room 302", ward: "ICU",
    status: "Online", battery: 45, network: "WiFi",
    sensors: { ecg: { status: "connected", signalPct: 60 }, spo2: { status: "disconnected" }, temp: { status: "connected", signalPct: 55 }, bp: { status: "connected" } },
  },
  {
    id: "8", serial: "TAB-013", location: "Bed 401 - Room 401", ward: "Emergency",
    status: "Online", battery: 22, network: "LTE",
    sensors: { ecg: { status: "connected", signalPct: 50 }, spo2: { status: "connected", signalPct: 44 }, temp: { status: "disconnected" }, bp: { status: "disconnected" } },
  },
  {
    id: "9", serial: "TAB-004", location: "Bed 202 - Room 202", ward: "Surgery",
    status: "Offline", battery: 0, network: "WiFi",
    sensors: { ecg: { status: "disconnected" }, spo2: { status: "disconnected" }, temp: { status: "disconnected" }, bp: { status: "disconnected" } },
  },
  {
    id: "10", serial: "TAB-006", location: "Bed 104 - Room 104", ward: "Internal Med",
    status: "Offline", battery: 0, network: "LTE",
    sensors: { ecg: { status: "disconnected" }, spo2: { status: "disconnected" }, temp: { status: "disconnected" }, bp: { status: "disconnected" } },
  },
]

// ── Constants ──────────────────────────────────────────────────────────────

const LOW_BATTERY_THRESHOLD = 20
const ALL_WARDS = "All"
const WARDS: Ward[] = ["Internal Med", "Surgery", "ICU", "Emergency"]

const SENSOR_KEYS = ["ecg", "spo2", "temp", "bp"] as const
type SensorKey = typeof SENSOR_KEYS[number]
const SENSOR_LABELS: Record<SensorKey, string> = { ecg: "ECG", spo2: "SpO2", temp: "Temp", bp: "BP" }

// ── Style Maps ─────────────────────────────────────────────────────────────

function batteryBarColor(pct: number): string {
  if (pct > 50) return "#16a34a"
  if (pct > 20) return "#f97316"
  return "#dc2626"
}

function deviceLeftBarColor(device: Device): string {
  if (device.status === "Offline") return "#9ca3af"
  if (device.battery <= LOW_BATTERY_THRESHOLD) return "#f97316"
  return "#16a34a"
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SignalBar({ pct }: { pct: number }) {
  const fillWidth = Math.round((pct / 100) * 90)
  return (
    <div className="relative h-[7px] w-[90px] rounded-[3px] bg-[#e5e7eb] overflow-hidden flex-shrink-0">
      <div
        className="absolute left-0 top-0 h-[7px] rounded-[3px]"
        style={{ width: fillWidth, backgroundColor: "#2563eb" }}
      />
    </div>
  )
}

function SensorRow({ label, detail }: { label: string; detail: SensorDetail }) {
  const connected = detail.status === "connected"
  const isBP = label === "BP"

  return (
    <div className="flex items-center gap-2 py-[5px]">
      <span
        className={cn("text-[12px] font-medium w-[36px] flex-shrink-0", connected ? "text-[#111827]" : "text-[#9ca3af]")}
      >
        {label}
      </span>
      {connected ? (
        <>
          <span className="text-[10px] text-[#16a34a] w-[68px] flex-shrink-0">connected</span>
          {isBP ? (
            <span className="text-[10px] font-semibold text-[#16a34a]">OK</span>
          ) : (
            <>
              <SignalBar pct={detail.signalPct ?? 0} />
              <span className="text-[11px] font-semibold text-[#4b5563] ml-1">{detail.signalPct ?? 0}%</span>
            </>
          )}
        </>
      ) : (
        <>
          <span className="text-[10px] text-[#9ca3af] w-[68px] flex-shrink-0">disconnected</span>
          <span className="text-[11px] font-semibold text-[#9ca3af]">--</span>
        </>
      )}
    </div>
  )
}

function DeviceCard({ device }: { device: Device }) {
  const isOnline = device.status === "Online"
  const isLowBattery = isOnline && device.battery <= LOW_BATTERY_THRESHOLD
  const connectedCount = SENSOR_KEYS.filter((k) => device.sensors[k].status === "connected").length
  const allConnected = connectedCount === SENSOR_KEYS.length
  const footerColor = allConnected ? "#16a34a" : isLowBattery ? "#f97316" : "#16a34a"

  return (
    <div
      className={cn(
        "rounded-[12px] overflow-hidden flex shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]",
        !isOnline && "bg-[#f8f9fa]"
      )}
    >
      {/* Left color bar */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: deviceLeftBarColor(device) }} />

      <div className="flex-1 px-4 py-3 min-w-0">
        {/* Header: dot + serial */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: isOnline ? "#16a34a" : "#9ca3af" }}
          />
          <span className="font-semibold text-[14px] text-[#111827]">{device.serial}</span>
        </div>

        {/* Location + battery + network badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-[#4b5563] truncate flex-1 min-w-0">{device.location}</span>
          {isOnline ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Battery bar */}
              <div className="relative w-5 h-[10px] rounded-[2px] bg-[#e5e7eb] overflow-hidden">
                <div
                  className="absolute left-0 top-[1px] h-2 rounded-[2px]"
                  style={{ width: `${Math.round((device.battery / 100) * 20)}px`, backgroundColor: batteryBarColor(device.battery) }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#4b5563]">{device.battery}%</span>
              {/* Network badge */}
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 rounded-[4px] leading-[18px]",
                  device.network === "WiFi"
                    ? "bg-[#dcfce7] text-[#16a34a]"
                    : "bg-[#eff6ff] text-[#2563eb]"
                )}
              >
                {device.network}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#9ca3af] flex-shrink-0">No signal</span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e5e7eb] mb-0" />

        {/* Sensor rows */}
        <div className="divide-y divide-[#f2f3f5]">
          {SENSOR_KEYS.map((key) => (
            <SensorRow key={key} label={SENSOR_LABELS[key]} detail={device.sensors[key]} />
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e5e7eb] mt-0 mb-2" />

        {/* Footer */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: footerColor }}>
            {connectedCount}/{SENSOR_KEYS.length} connected
          </span>
          {isLowBattery && (
            <span className="text-[10px] font-medium bg-[#fff7ed] text-[#f97316] px-2 rounded-[4px] leading-[18px]">
              low battery
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DeviceStatusPage() {
  const [selectedWard, setSelectedWard] = useState<Ward | typeof ALL_WARDS>(ALL_WARDS)

  const filteredDevices =
    selectedWard === ALL_WARDS
      ? mockDevices
      : mockDevices.filter((d) => d.ward === selectedWard)

  const onlineCount = mockDevices.filter((d) => d.status === "Online").length
  const offlineCount = mockDevices.filter((d) => d.status === "Offline").length
  const totalCount = mockDevices.length
  const lowBatteryCount = mockDevices.filter(
    (d) => d.status === "Online" && d.battery <= LOW_BATTERY_THRESHOLD
  ).length

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Device Status</h1>
        <p className="text-sm text-[#4b5563]">Real-time status of all connected devices</p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 h-11 px-5 bg-[#eff6ff] rounded-[8px]">
        {[
          { dot: "#2563eb", label: "Total", count: totalCount, countColor: "#2563eb" },
          { dot: "#16a34a", label: "Online", count: onlineCount, countColor: "#16a34a" },
          { dot: "#9ca3af", label: "Offline", count: offlineCount, countColor: "#9ca3af" },
          { dot: "#f97316", label: "Low Battery", count: lowBatteryCount, countColor: "#f97316" },
        ].map(({ dot, label, count, countColor }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
            <span className="text-[13px] text-[#4b5563]">{label}</span>
            <span className="text-[14px] font-bold" style={{ color: countColor }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Ward filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[ALL_WARDS, ...WARDS].map((ward) => {
          const active = selectedWard === ward
          return (
            <button
              key={ward}
              onClick={() => setSelectedWard(ward as Ward | typeof ALL_WARDS)}
              className={cn(
                "h-[36px] px-4 rounded-[8px] text-[13px] transition-colors",
                active
                  ? "bg-[#2563eb] text-white font-semibold border border-[#2563eb]"
                  : "bg-white text-[#4b5563] border border-[#d1d5db] hover:bg-[#f9fafb]"
              )}
            >
              {ward}
            </button>
          )
        })}
      </div>

      {/* Device card grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SensorStatus = "connected" | "disconnected"
type DeviceStatus = "Online" | "Offline"

type Device = {
  id: string
  serial: string
  location: string
  status: DeviceStatus
  heartbeat: string
  sensors: {
    ecg: SensorStatus
    spo2: SensorStatus
    temp: SensorStatus
    bp: SensorStatus
  }
}

const mockDevices: Device[] = [
  { id: "1",  serial: "TAB-001", location: "Ward A / Bed 101", status: "Online",  heartbeat: "Now",    sensors: { ecg: "connected", spo2: "connected", temp: "connected", bp: "connected" } },
  { id: "2",  serial: "TAB-002", location: "Ward A / Bed 102", status: "Online",  heartbeat: "1m",     sensors: { ecg: "connected", spo2: "connected", temp: "disconnected", bp: "connected" } },
  { id: "3",  serial: "TAB-003", location: "Ward B / Bed 201", status: "Online",  heartbeat: "2m",     sensors: { ecg: "connected", spo2: "connected", temp: "connected", bp: "disconnected" } },
  { id: "4",  serial: "TAB-005", location: "Ward C / Bed 301", status: "Online",  heartbeat: "3m",     sensors: { ecg: "connected", spo2: "connected", temp: "connected", bp: "connected" } },
  { id: "5",  serial: "TAB-007", location: "Ward A / Bed 103", status: "Online",  heartbeat: "4m",     sensors: { ecg: "disconnected", spo2: "connected", temp: "connected", bp: "connected" } },
  { id: "6",  serial: "TAB-009", location: "Ward B / Bed 203", status: "Online",  heartbeat: "5m",     sensors: { ecg: "connected", spo2: "connected", temp: "connected", bp: "connected" } },
  { id: "7",  serial: "TAB-011", location: "Ward C / Bed 302", status: "Online",  heartbeat: "7m",     sensors: { ecg: "connected", spo2: "disconnected", temp: "connected", bp: "connected" } },
  { id: "8",  serial: "TAB-004", location: "Ward B / Bed 202", status: "Offline", heartbeat: "3h ago", sensors: { ecg: "disconnected", spo2: "disconnected", temp: "disconnected", bp: "disconnected" } },
  { id: "9",  serial: "TAB-006", location: "Unassigned",       status: "Offline", heartbeat: "2d ago", sensors: { ecg: "disconnected", spo2: "disconnected", temp: "disconnected", bp: "disconnected" } },
]

const onlineCount = mockDevices.filter((d) => d.status === "Online").length
const offlineCount = mockDevices.filter((d) => d.status === "Offline").length
const totalCount = mockDevices.length

const statCards = [
  { label: "Online Devices",  subtitle: "Connected",      value: onlineCount,  borderColor: "bg-[#16a34a]", valueColor: "text-[#16a34a]", iconBg: "bg-[#dcfce7]" },
  { label: "Offline Devices", subtitle: "Not responding",  value: offlineCount, borderColor: "bg-[#9ca3af]", valueColor: "text-[#9ca3af]", iconBg: "bg-[#f3f4f6]" },
  { label: "Total Devices",   subtitle: "Registered",      value: totalCount,   borderColor: "bg-[#2563eb]", valueColor: "text-[#2563eb]", iconBg: "bg-[#eff6ff]" },
]

const SENSOR_LABELS = ["ECG", "SpO2", "Temp", "BP"] as const
const SENSOR_KEYS: Record<typeof SENSOR_LABELS[number], keyof Device["sensors"]> = {
  ECG: "ecg",
  SpO2: "spo2",
  Temp: "temp",
  BP: "bp",
}

export default function DeviceStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Device Status</h1>
        <p className="text-sm text-[#4b5563]">Real-time status of all connected devices</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, subtitle, value, borderColor, valueColor, iconBg }) => (
          <Card key={label} className="shadow-sm overflow-hidden">
            <CardContent className="p-0 flex items-center">
              <div className={cn("w-1 self-stretch flex-shrink-0", borderColor)} />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={cn("w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
                  <span className={cn("text-lg font-bold", valueColor)}>{value}</span>
                </div>
                <div>
                  <p className="font-semibold text-[15px] text-[#111827]">{label}</p>
                  <p className="text-xs text-[#4b5563]">{subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {mockDevices.map((device) => {
          const isOnline = device.status === "Online"
          return (
            <Card
              key={device.id}
              className={cn(
                "shadow-sm overflow-hidden",
                !isOnline && "bg-[#f8f9fa]"
              )}
            >
              <CardContent className="p-0">
                <div className={cn("flex", isOnline ? "border-l-[3px] border-l-[#16a34a]" : "border-l-[3px] border-l-[#9ca3af]")}>
                  <div className="flex-1 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isOnline ? "bg-[#16a34a]" : "bg-[#9ca3af]"
                          )}
                        />
                        <span className="font-semibold text-sm text-[#111827]">{device.serial}</span>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] font-semibold border-0",
                          isOnline
                            ? "bg-[#dcfce7] text-[#16a34a]"
                            : "bg-[#f3f4f6] text-[#9ca3af]"
                        )}
                      >
                        {device.status}
                      </Badge>
                    </div>

                    {/* Location */}
                    <p className="text-xs text-[#4b5563] mb-0.5">{device.location}</p>
                    <p className="text-[11px] text-[#9ca3af] mb-3">Heartbeat: {device.heartbeat}</p>

                    {/* Divider */}
                    <div className="border-t border-[#e5e7eb] pt-3">
                      <p className="text-[11px] font-semibold text-[#9ca3af] mb-2">Sensors</p>
                      <div className="flex items-center gap-3">
                        {SENSOR_LABELS.map((label) => {
                          const key = SENSOR_KEYS[label]
                          const connected = device.sensors[key] === "connected"
                          return (
                            <div key={label} className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "w-[7px] h-[7px] rounded-full flex-shrink-0",
                                  connected ? "bg-[#16a34a]" : "bg-[#9ca3af]"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[11px]",
                                  connected ? "text-[#111827]" : "text-[#9ca3af]"
                                )}
                              >
                                {label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

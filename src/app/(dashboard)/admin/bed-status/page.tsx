// Server Component
import { Bed, Users, DoorOpen, TrendingUp } from "lucide-react"
import { type StatItem, type WardItem, BedStatusClient } from "./bed-status-client"

const stats: StatItem[] = [
  { label: "Total Beds", value: "120", outerBg: "bg-status-info-bg", innerBg: "bg-status-info", icon: Bed },
  { label: "Occupied", value: "89", outerBg: "bg-status-critical-bg", innerBg: "bg-status-critical", icon: Users },
  { label: "Available", value: "31", outerBg: "bg-status-normal-bg", innerBg: "bg-status-normal", icon: DoorOpen },
  { label: "Occupancy", value: "74%", outerBg: "bg-status-warning-bg", innerBg: "bg-status-warning", icon: TrendingUp },
]

const wards: WardItem[] = [
  { name: "Internal Medicine", occupied: 24, total: 32 },
  { name: "Surgery", occupied: 20, total: 24 },
  { name: "Pediatrics", occupied: 12, total: 20 },
  { name: "ICU", occupied: 15, total: 16 },
  { name: "Emergency", occupied: 8, total: 12 },
  { name: "Rehabilitation", occupied: 10, total: 16 },
]

export default function BedStatusPage() {
  // 향후: const [stats, wards] = await fetchBedStatus()
  return <BedStatusClient initialStats={stats} initialWards={wards} />
}

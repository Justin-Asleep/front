import { Bed, Users, DoorOpen, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { label: "Total Beds", value: "120", outerBg: "bg-status-info-bg", innerBg: "bg-status-info", icon: Bed },
  { label: "Occupied", value: "89", outerBg: "bg-status-critical-bg", innerBg: "bg-status-critical", icon: Users },
  { label: "Available", value: "31", outerBg: "bg-status-normal-bg", innerBg: "bg-status-normal", icon: DoorOpen },
  { label: "Occupancy", value: "74%", outerBg: "bg-status-warning-bg", innerBg: "bg-status-warning", icon: TrendingUp },
]

const wards = [
  { name: "Internal Medicine", occupied: 24, total: 32 },
  { name: "Surgery", occupied: 20, total: 24 },
  { name: "Pediatrics", occupied: 12, total: 20 },
  { name: "ICU", occupied: 15, total: 16 },
  { name: "Emergency", occupied: 8, total: 12 },
  { name: "Rehabilitation", occupied: 10, total: 16 },
]

function getOccupancyStyle(rate: number) {
  if (rate >= 90) {
    return { badge: "bg-status-critical-bg text-status-critical", bar: "var(--status-critical)" }
  }
  if (rate >= 70) {
    return { badge: "bg-status-warning-bg text-status-warning", bar: "var(--status-warning)" }
  }
  return { badge: "bg-status-normal-bg text-status-normal", bar: "var(--status-normal)" }
}

export default function BedStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Bed Status</h1>
        <p className="text-[14px] text-muted-foreground">Real-time bed occupancy overview by ward</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, outerBg, innerBg, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${outerBg}`}>
                <div className={`w-8 h-8 rounded flex items-center justify-center ${innerBg}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-[28px] font-bold leading-tight text-foreground">{value}</p>
                <p className="text-[13px] text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {wards.map(({ name, occupied, total }) => {
          const rate = Math.round((occupied / total) * 100)
          const style = getOccupancyStyle(rate)
          return (
            <Card key={name} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-semibold text-foreground">{name}</span>
                  <span
                    className={`text-[12px] font-bold px-3 py-0.5 rounded-full w-[56px] text-center ${style.badge}`}
                    aria-label={`${rate}% ${rate >= 90 ? 'Critical' : rate >= 70 ? 'Warning' : 'Normal'}`}
                  >
                    {rate}%
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground mb-2">{occupied} / {total} beds</p>
                <div className="w-full h-2.5 rounded-full bg-border mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${rate}%`, backgroundColor: style.bar }}
                  />
                </div>
                <div className="flex gap-8 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: style.bar }} />
                    Occupied: {occupied}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-border inline-block shrink-0" />
                    Available: {total - occupied}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div
        className="flex items-center gap-6 flex-wrap text-[12px] text-muted-foreground"
        aria-label="Occupancy level legend"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-status-critical shrink-0" />
          Critical (&ge; 90%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-status-warning shrink-0" />
          Warning (70-89%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-status-normal shrink-0" />
          Normal (&lt; 70%)
        </span>
      </div>
    </div>
  )
}

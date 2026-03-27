import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { label: "Total Beds", value: "120", outerBg: "bg-[#eff6ff]", innerBg: "bg-[#3b82f6]" },
  { label: "Occupied", value: "89", outerBg: "bg-[#fef2f2]", innerBg: "bg-[#ef4444]" },
  { label: "Available", value: "31", outerBg: "bg-[#dcfce7]", innerBg: "bg-[#16a34a]" },
  { label: "Occupancy", value: "74%", outerBg: "bg-[#fff7ed]", innerBg: "bg-[#f97316]" },
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
    return { badge: "bg-[#fef2f2] text-[#ef4444]", bar: "#ef4444" }
  }
  if (rate >= 70) {
    return { badge: "bg-[#fffbe7] text-[#cc8f00]", bar: "#f9bf24" }
  }
  return { badge: "bg-[#dcfce7] text-[#0e7e38]", bar: "#16a34a" }
}

export default function BedStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bed Status</h1>
        <p className="text-muted-foreground">Real-time bed occupancy overview by ward</p>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, outerBg, innerBg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${outerBg}`}>
                <div className={`w-5 h-5 rounded ${innerBg}`} />
              </div>
              <div>
                <p className="text-[28px] font-bold leading-tight text-[#111827]">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 병동별 카드 6개 (3x2) */}
      <div className="grid grid-cols-3 gap-4">
        {wards.map(({ name, occupied, total }) => {
          const rate = Math.round((occupied / total) * 100)
          const style = getOccupancyStyle(rate)
          return (
            <Card key={name} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#111827]">{name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                    {rate}%
                  </span>
                </div>
                <p className="text-sm text-[#4b5563] mb-2">{occupied} / {total} beds</p>
                <div className="w-full h-2.5 rounded-full bg-[#e5e7eb] mb-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${rate}%`, backgroundColor: style.bar }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: style.bar }} />
                    Occupied: {occupied}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] inline-block" />
                    Available: {total - occupied}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-8 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block bg-[#ef4444]" />
          Critical (&ge; 90%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block bg-[#f9bf24]" />
          Warning (70-89%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block bg-[#16a34a]" />
          Normal (&lt; 70%)
        </span>
      </div>
    </div>
  )
}

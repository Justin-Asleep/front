"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bed, Users, DoorOpen, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/services/api"

// ── Types ──────────────────────────────────────────────────────────────────────
interface WardBedStatus {
  ward_id: string
  ward_name: string
  total_beds: number
  occupied_beds: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getOccupancyStyle(rate: number) {
  if (rate >= 90) {
    return { badge: "bg-status-critical-bg text-status-critical", bar: "var(--status-critical)" }
  }
  if (rate >= 70) {
    return { badge: "bg-status-warning-bg text-status-warning", bar: "var(--status-warning)" }
  }
  return { badge: "bg-status-normal-bg text-status-normal", bar: "var(--status-normal)" }
}

// ── Client Component ───────────────────────────────────────────────────────────
export function BedStatusClient() {
  const [wards, setWards] = useState<WardBedStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGet<WardBedStatus[]>("/proxy/wards/bed-status")
      setWards(data)
    } catch (err) {
      setError("Failed to load bed status")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = useMemo(() => {
    const totalBeds = wards.reduce((sum, w) => sum + w.total_beds, 0)
    const occupiedBeds = wards.reduce((sum, w) => sum + w.occupied_beds, 0)
    const availableBeds = totalBeds - occupiedBeds
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    return [
      { label: "Total Beds", value: String(totalBeds), outerBg: "bg-status-info-bg", innerBg: "bg-status-info", icon: Bed },
      { label: "Occupied", value: String(occupiedBeds), outerBg: "bg-status-critical-bg", innerBg: "bg-status-critical", icon: Users },
      { label: "Available", value: String(availableBeds), outerBg: "bg-status-normal-bg", innerBg: "bg-status-normal", icon: DoorOpen },
      { label: "Occupancy", value: `${occupancyPct}%`, outerBg: "bg-status-warning-bg", innerBg: "bg-status-warning", icon: TrendingUp },
    ]
  }, [wards])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading bed status...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-[#dc2626]">{error}</p>
        <Button variant="outline" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

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
        {wards.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No wards found.</p>
        ) : (
          wards.map(({ ward_id, ward_name, occupied_beds, total_beds }) => {
            const rate = total_beds > 0 ? Math.round((occupied_beds / total_beds) * 100) : 0
            const style = getOccupancyStyle(rate)
            return (
              <Card key={ward_id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-semibold text-foreground">{ward_name}</span>
                    <span className={`text-[12px] font-bold px-3 py-0.5 rounded-full w-[56px] text-center ${style.badge}`}>
                      {rate}%
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mb-2">{occupied_beds} / {total_beds} beds</p>
                  <div className="w-full h-2.5 rounded-full bg-border mb-3">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${rate}%`, backgroundColor: style.bar }}
                    />
                  </div>
                  <div className="flex gap-8 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: style.bar }} />
                      Occupied: {occupied_beds}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-border inline-block shrink-0" />
                      Available: {total_beds - occupied_beds}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-6 flex-wrap text-[12px] text-muted-foreground">
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

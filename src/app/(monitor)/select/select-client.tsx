"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiGet } from "@/services/api"
import { HeaderNav } from "@/components/layout/header-nav"
import { Monitor, Tv } from "lucide-react"
import { unlockAlarmAudio } from "@/lib/alarm-sound"

interface StationItem {
  id: string
  name: string
  url_key: string
  is_active: boolean
}

interface MonitorItem {
  id: string
  name: string
  url_key: string
  layout: string
  is_active: boolean
}

interface PaginatedData<T> {
  items: T[]
  total: number
}

export function SelectClient() {
  const router = useRouter()
  const [stations, setStations] = useState<StationItem[]>([])
  const [monitors, setMonitors] = useState<MonitorItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [stationRes, monitorRes] = await Promise.all([
          apiGet<PaginatedData<StationItem>>("/proxy/monitors/stations?page=1&size=100"),
          apiGet<PaginatedData<MonitorItem>>("/proxy/monitors?page=1&size=100"),
        ])
        setStations(stationRes.items.filter((s) => s.is_active))
        setMonitors(monitorRes.items.filter((m) => m.is_active))
      } catch (err) {
        console.error("Failed to load selections:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050510]">
        <p className="text-[#808099]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050510] flex flex-col">
      <HeaderNav variant="dark" showTabs={false} subtitle="Select a station or monitor to begin" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-4xl space-y-10">
          {/* Stations */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Tv className="size-5 text-[#2563eb]" />
              <h2 className="text-[18px] font-semibold text-white">Stations</h2>
              <span className="text-xs text-[#808099]">({stations.length})</span>
            </div>
            {stations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { unlockAlarmAudio(); router.push(`/station/${s.url_key}`) }}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-[#0a0b1a] border border-[#1e1f35] hover:border-[#2563eb] hover:bg-[#0d0e24] transition-all group"
                  >
                    <Tv className="size-8 text-[#555] group-hover:text-[#2563eb] transition-colors" />
                    <span className="text-sm font-medium text-[#b2b2cc] group-hover:text-white transition-colors">
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#555]">No active stations</p>
            )}
          </section>

          {/* Monitors */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="size-5 text-[#22c55e]" />
              <h2 className="text-[18px] font-semibold text-white">Monitors</h2>
              <span className="text-xs text-[#808099]">({monitors.length})</span>
            </div>
            {monitors.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {monitors.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { unlockAlarmAudio(); router.push(`/monitor/${m.url_key}`) }}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-[#0a0b1a] border border-[#1e1f35] hover:border-[#22c55e] hover:bg-[#0d0e24] transition-all group"
                  >
                    <Monitor className="size-8 text-[#555] group-hover:text-[#22c55e] transition-colors" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-[#b2b2cc] group-hover:text-white transition-colors block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-[#555]">{m.layout}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#555]">No active monitors</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

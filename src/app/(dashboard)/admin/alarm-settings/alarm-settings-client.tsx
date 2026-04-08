"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { apiGet, apiPut } from "@/services/api"
import { toast } from "sonner"

// ─�� Types ──────────────────────────────────────────���───────────────────────────
interface AlarmThreshold {
  id: string
  hospital_id: string
  param_type: string
  critical_low: number | null
  warning_low: number | null
  warning_high: number | null
  critical_high: number | null
}

type ThresholdKey = "critical_low" | "warning_low" | "warning_high" | "critical_high"

// ── Constants ───────────────────────────────────────────────���──────────────────
const PARAM_META: Record<string, { name: string; unit: string; dot: string; naFields: ThresholdKey[] }> = {
  HR:     { name: "Heart Rate (HR)",   unit: "bpm",  dot: "#16a34a", naFields: [] },
  SPO2:   { name: "SpO2",             unit: "%",    dot: "#3b82f6", naFields: ["warning_high", "critical_high"] },
  RR:     { name: "Respiratory Rate",  unit: "bpm",  dot: "#f97316", naFields: [] },
  TEMP:   { name: "Temperature",       unit: "°C",   dot: "#a855f7", naFields: [] },
  BP_SYS: { name: "BP Systolic",       unit: "mmHg", dot: "#ef4444", naFields: [] },
  BP_DIA: { name: "BP Diastolic",      unit: "mmHg", dot: "#ef4444", naFields: [] },
}

const PARAM_ORDER = ["HR", "SPO2", "RR", "TEMP", "BP_SYS", "BP_DIA"]

const thresholdColumns: { key: ThresholdKey; label: string; type: "critical" | "warning" }[] = [
  { key: "critical_low",  label: "Low Critical",  type: "critical" },
  { key: "warning_low",   label: "Low Warning",   type: "warning" },
  { key: "warning_high",  label: "High Warning",  type: "warning" },
  { key: "critical_high", label: "High Critical",  type: "critical" },
]

// ── Client Component ─────────────���─────────────────────────────────────────────
export function AlarmSettingsClient() {
  const [thresholds, setThresholds] = useState<AlarmThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiGet<AlarmThreshold[]>("/proxy/alarm-settings")
      setThresholds(data)
    } catch (err) {
      console.error("Failed to load alarm settings:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleChange(paramType: string, key: ThresholdKey, value: string) {
    setThresholds((prev) =>
      prev.map((t) =>
        t.param_type === paramType ? { ...t, [key]: value === "" ? null : parseFloat(value) } : t
      )
    )
  }

  const ordered = useMemo(() => PARAM_ORDER.map((pt) => thresholds.find((t) => t.param_type === pt)).filter(Boolean) as AlarmThreshold[], [thresholds])

  async function handleSave() {
    try {
      setSaving(true)
      await apiPut("/proxy/alarm-settings", {
        thresholds: thresholds.map((t) => ({
          param_type: t.param_type,
          critical_low: t.critical_low,
          warning_low: t.warning_low,
          warning_high: t.warning_high,
          critical_high: t.critical_high,
        })),
      })
      toast.success("Alarm settings saved")
    } catch (err) {
      console.error("Failed to save:", err)
      toast.error("Failed to save alarm settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading alarm settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Alarm Settings</h1>
        <p className="text-[14px] text-[#4b5563]">Configure vital parameter alarm thresholds</p>
      </div>
      <Card className="max-w-[1136px]">
        <CardContent className="pt-0 px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] h-[52px]">
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Parameter</TableHead>
                {thresholdColumns.map(({ key, label }) => (
                  <TableHead key={key} className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((threshold, idx) => {
                const meta = PARAM_META[threshold.param_type]
                if (!meta) return null
                return (
                  <TableRow key={threshold.param_type} className={cn("h-[92px]", idx % 2 === 0 ? "bg-white" : "bg-[#fcfcfe]")}>
                    <TableCell className="px-4">
                      <div className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-[3px]" style={{ backgroundColor: meta.dot }} />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#111827]">{meta.name}</span>
                          <span className="text-[12px] text-[#9ca3af]">{meta.unit}</span>
                        </div>
                      </div>
                    </TableCell>
                    {thresholdColumns.map(({ key, type }) => {
                      const isNA = meta.naFields.includes(key)
                      const value = threshold[key]
                      return (
                        <TableCell key={key}>
                          {isNA ? (
                            <div className="h-[44px] w-[180px] border border-[#d1d5db] rounded-[6px] bg-[#f5f6f7] flex items-center justify-center">
                              <span className="text-[13px] text-[#9ca3af]">N/A</span>
                            </div>
                          ) : (
                            <div className="h-[44px] w-[180px] border border-[#d1d5db] rounded-[6px] bg-white flex items-center px-3 gap-2">
                              <input
                                type="number"
                                step="any"
                                value={value ?? ""}
                                onChange={(e) => handleChange(threshold.param_type, key, e.target.value)}
                                className={cn(
                                  "w-[80px] h-[28px] rounded-[4px] text-center text-[13px] font-bold outline-none",
                                  type === "critical" ? "bg-[#fef2f2] text-[#ef4444]" : "bg-[#fff7ed] text-[#f97316]"
                                )}
                              />
                              <span className="text-[12px] text-[#9ca3af]">{meta.unit}</span>
                            </div>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="flex justify-end gap-3 px-6 h-[64px] items-center border-t border-[#e5e7eb]">
            <Button variant="outline" onClick={fetchData}>Cancel</Button>
            <Button
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-[1136px] rounded-[6px] bg-[#eff6ff] px-4 h-[48px] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
        <p className="text-[13px] text-[#2563eb]">
          Changes apply to all monitors. Existing alarms will be re-evaluated.
        </p>
      </div>
    </div>
  )
}

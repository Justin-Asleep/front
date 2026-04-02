"use client"

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

type ThresholdKey = "lowCritical" | "lowWarning" | "highWarning" | "highCritical"

export interface Parameter {
  name: string
  unit: string
  dot: string
  values: Record<ThresholdKey, string>
  naFields: ThresholdKey[]
}

const thresholdColumns: { key: ThresholdKey; label: string; type: "critical" | "warning" }[] = [
  { key: "lowCritical", label: "Low Critical", type: "critical" },
  { key: "lowWarning", label: "Low Warning", type: "warning" },
  { key: "highWarning", label: "High Warning", type: "warning" },
  { key: "highCritical", label: "High Critical", type: "critical" },
]

export function AlarmSettingsClient({ initialParameters }: { initialParameters: Parameter[] }) {
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
              {initialParameters.map((param, idx) => (
                <TableRow key={param.name} className={cn("h-[92px]", idx % 2 === 0 ? "bg-white" : "bg-[#fcfcfe]")}>
                  <TableCell className="px-4">
                    <div className="flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-[3px]"
                        style={{ backgroundColor: param.dot }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-[#111827]">{param.name}</span>
                        <span className="text-[12px] text-[#9ca3af]">{param.unit}</span>
                      </div>
                    </div>
                  </TableCell>
                  {thresholdColumns.map(({ key, type }) => {
                    const isNA = param.naFields.includes(key)
                    return (
                      <TableCell key={key}>
                        {isNA ? (
                          <div className="h-[44px] w-[180px] border border-[#d1d5db] rounded-[6px] bg-[#f5f6f7] flex items-center justify-center">
                            <span className="text-[13px] text-[#9ca3af]">N/A</span>
                          </div>
                        ) : (
                          <div className="h-[44px] w-[180px] border border-[#d1d5db] rounded-[6px] bg-white flex items-center">
                            <div
                              className={cn(
                                "ml-[11px] h-[28px] w-[56px] rounded-[4px] flex items-center justify-center shrink-0",
                                type === "critical" ? "bg-[#fef2f2]" : "bg-[#fff7ed]"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[13px] font-bold",
                                  type === "critical" ? "text-[#ef4444]" : "text-[#f97316]"
                                )}
                              >
                                {param.values[key]}
                              </span>
                            </div>
                            <span className="text-[12px] text-[#9ca3af] ml-[10px]">{param.unit}</span>
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end gap-3 px-6 h-[64px] items-center border-t border-[#e5e7eb]">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Save Changes</Button>
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

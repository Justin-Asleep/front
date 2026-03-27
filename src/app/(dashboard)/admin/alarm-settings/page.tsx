"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

interface Parameter {
  name: string
  unit: string
  dot: string
  values: Record<ThresholdKey, string>
  naFields: ThresholdKey[]
}

const parameters: Parameter[] = [
  {
    name: "Heart Rate",
    unit: "bpm",
    dot: "#16a34a",
    values: { lowCritical: "50", lowWarning: "60", highWarning: "100", highCritical: "150" },
    naFields: [],
  },
  {
    name: "SpO2",
    unit: "%",
    dot: "#3b82f6",
    values: { lowCritical: "85", lowWarning: "90", highWarning: "", highCritical: "" },
    naFields: ["highWarning", "highCritical"],
  },
  {
    name: "Respiratory Rate",
    unit: "bpm",
    dot: "#f97316",
    values: { lowCritical: "8", lowWarning: "12", highWarning: "20", highCritical: "30" },
    naFields: [],
  },
  {
    name: "Temperature",
    unit: "C",
    dot: "#a855f7",
    values: { lowCritical: "35.0", lowWarning: "36.0", highWarning: "37.5", highCritical: "39.5" },
    naFields: [],
  },
  {
    name: "BP Systolic",
    unit: "mmHg",
    dot: "#ef4444",
    values: { lowCritical: "80", lowWarning: "90", highWarning: "140", highCritical: "180" },
    naFields: [],
  },
]

const thresholdColumns: { key: ThresholdKey; label: string; type: "critical" | "warning" }[] = [
  { key: "lowCritical", label: "Low Critical", type: "critical" },
  { key: "lowWarning", label: "Low Warning", type: "warning" },
  { key: "highWarning", label: "High Warning", type: "warning" },
  { key: "highCritical", label: "High Critical", type: "critical" },
]

export default function AlarmSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alarm Settings</h1>
        <p className="text-muted-foreground">Configure vital parameter alarm thresholds</p>
      </div>
      <Card className="max-w-[1136px]">
        <CardHeader className="border-b">
          <CardTitle>Alarm Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb]">
                <TableHead>Parameter</TableHead>
                {thresholdColumns.map(({ key, label, type }) => (
                  <TableHead
                    key={key}
                    className={cn(
                      type === "critical" ? "text-[#ef4444]" : "text-[#f97316]"
                    )}
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param, idx) => (
                <TableRow key={param.name} className={idx % 2 === 0 ? "bg-white" : "bg-[#fcfcfe]"}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: param.dot }}
                      />
                      <span className="font-medium">{param.name}</span>
                      <span className="text-muted-foreground text-xs">({param.unit})</span>
                    </div>
                  </TableCell>
                  {thresholdColumns.map(({ key, type }) => {
                    const isNA = param.naFields.includes(key)
                    return (
                      <TableCell key={key}>
                        <Input
                          disabled={isNA}
                          defaultValue={isNA ? "N/A" : param.values[key]}
                          className={cn(
                            "w-20 text-center",
                            isNA && "disabled:opacity-100 disabled:bg-[#f5f6f7] disabled:text-[#9ca3af]",
                            !isNA && type === "critical" && "bg-[#fef2f2] text-[#ef4444] border-[#ef4444] focus-visible:ring-[#ef4444]/20",
                            !isNA && type === "warning" && "bg-[#fff7ed] text-[#f97316] border-[#f97316] focus-visible:ring-[#f97316]/20",
                          )}
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 rounded-md bg-[#eff6ff] p-3">
            <p className="text-sm text-[#2563eb]">
              Changes apply to all monitors. Existing alarms will be re-evaluated.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

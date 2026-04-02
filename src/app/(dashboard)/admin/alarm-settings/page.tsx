// Server Component
import { type Parameter, AlarmSettingsClient } from "./alarm-settings-client"

const mockParameters: Parameter[] = [
  {
    name: "Heart Rate (HR)",
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

export default function AlarmSettingsPage() {
  // 향후: const parameters = await fetchAlarmSettings()
  const parameters = mockParameters
  return <AlarmSettingsClient initialParameters={parameters} />
}

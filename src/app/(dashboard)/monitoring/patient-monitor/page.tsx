import { Suspense } from "react"
import { PatientMonitorClient } from "./patient-monitor-client"

export default function PatientMonitorPage() {
  return (
    <Suspense>
      <PatientMonitorClient />
    </Suspense>
  )
}

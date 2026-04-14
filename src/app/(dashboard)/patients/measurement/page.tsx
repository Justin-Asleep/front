import { Suspense } from "react"
import { MeasurementClient } from "./measurement-client"

export default function MeasurementPage() {
  return (
    <Suspense>
      <MeasurementClient />
    </Suspense>
  )
}

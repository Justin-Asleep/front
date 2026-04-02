// Server Component
import { initialWards } from "@/data/ward-data"
import { WardsClient } from "./wards-client"

export default function WardsPage() {
  // 향후: const wards = await fetchWards()
  const wards = initialWards
  return <WardsClient initialWards={wards} />
}

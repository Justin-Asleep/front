// Server Component
import { notFound } from "next/navigation"
import { initialWards, allRooms } from "@/data/ward-data"
import { WardDetailClient } from "./ward-detail-client"

export default async function WardDetailPage({
  params,
}: {
  params: Promise<{ wardId: string }>
}) {
  const { wardId } = await params
  const ward = initialWards.find((w) => w.id === wardId)
  if (!ward) notFound()

  const wardRooms = allRooms.filter((r) => r.ward === ward.name)

  return <WardDetailClient initialWard={ward} initialRooms={wardRooms} />
}

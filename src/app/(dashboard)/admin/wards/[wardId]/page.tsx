import { WardDetailClient } from "./ward-detail-client"

export default async function WardDetailPage({
  params,
}: {
  params: Promise<{ wardId: string }>
}) {
  const { wardId } = await params
  return <WardDetailClient wardId={wardId} />
}

import { StationFullscreenClient } from "./station-fullscreen-client"

export default async function StationFullscreenPage({
  params,
}: {
  params: Promise<{ urlKey: string }>
}) {
  const { urlKey } = await params
  return <StationFullscreenClient urlKey={urlKey} />
}

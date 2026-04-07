import { MonitorFullscreenClient } from "./monitor-fullscreen-client"

export default async function MonitorFullscreenPage({
  params,
}: {
  params: Promise<{ urlKey: string }>
}) {
  const { urlKey } = await params
  return <MonitorFullscreenClient urlKey={urlKey} />
}

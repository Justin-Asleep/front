import { useEffect, useRef, useCallback, useState } from "react"

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "http://localhost:8002"
const RECONNECT_INTERVAL = 5000
const MAX_RECONNECT_ATTEMPTS = 10

interface UseSSEOptions<T> {
  path: string
  onSnapshot: (data: T) => void
  onVitals?: (data: Record<string, unknown>) => void
  onAlarm?: (data: Record<string, unknown>) => void
  onEcg?: (data: Record<string, unknown>) => void
}

export function useSSE<T>({ path, onSnapshot, onVitals, onAlarm, onEcg }: UseSSEOptions<T>) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)

  const onSnapshotRef = useRef(onSnapshot)
  const onVitalsRef = useRef(onVitals)
  const onAlarmRef = useRef(onAlarm)
  const onEcgRef = useRef(onEcg)
  onSnapshotRef.current = onSnapshot
  onVitalsRef.current = onVitals
  onAlarmRef.current = onAlarm
  onEcgRef.current = onEcg

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
    }

    const es = new EventSource(`${STREAM_URL}${path}`)
    esRef.current = es

    es.addEventListener("snapshot", (e) => {
      const data: T = JSON.parse(e.data)
      onSnapshotRef.current(data)
      setConnected(true)
      setError(null)
      reconnectAttempts.current = 0
    })

    es.addEventListener("vitals", (e) => {
      onVitalsRef.current?.(JSON.parse(e.data))
    })

    es.addEventListener("alarm", (e) => {
      onAlarmRef.current?.(JSON.parse(e.data))
    })

    es.addEventListener("ecg", (e) => {
      onEcgRef.current?.(JSON.parse(e.data))
    })

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false)
        es.close()
        esRef.current = null

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1
          setError(`Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`)
          reconnectTimer.current = setTimeout(connect, RECONNECT_INTERVAL)
        } else {
          setError("Connection lost. Please refresh the page.")
        }
      }
    }
  }, [path])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (esRef.current) esRef.current.close()
      esRef.current = null
    }
  }, [connect])

  return { connected, error }
}

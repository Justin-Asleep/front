import { useEffect, useRef, useCallback, useState } from "react"

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "http://localhost:8002"
const RECONNECT_INTERVAL = 5000
const MAX_RECONNECT_ATTEMPTS = 10

// ── SSE payloads ─────────────────────────────────────────────────────────────
// Mirrors libs/infrastructure/redis/messages.py. SSE event names are derived
// from the Redis channel's last segment (see stream-server sse_service.py):
//   bed:{id}:vitals    → "vitals"
//   bed:{id}:alarms    → "alarms"   ← plural, not "alarm"
//   bed:{id}:ecg       → "ecg"
//   bed:{id}:heartbeat → "heartbeat"
//   bed:{id}:encounter → "encounter"
//   monitor|station:{id}:config → "config"

export interface VitalsSSEMessage {
  event: "vitals"
  bed_id: string
  encounter_id: string
  type: string
  value: number | null
  extra_value: number | null
  measured_at: string
}

export interface EcgSSEMessage {
  event: "ecg"
  bed_id: string
  encounter_id: string
  measured_at: string
  samples: number[]
  sample_rate_hz: number
}

export interface AlarmTriggeredSSEMessage {
  event: "alarm_triggered"
  bed_id: string
  encounter_id: string
  severity: string
  param: string
  value: number
  extra_value: number | null
  message: string
}

export interface AlarmResolvedSSEMessage {
  event: "alarm_resolved"
  bed_id: string
  encounter_id: string
  param: string
}

export type AlarmSSEMessage = AlarmTriggeredSSEMessage | AlarmResolvedSSEMessage

export interface SensorStatusPayload {
  connected: boolean
  battery_level: number | null
  signal_quality: number | null
}

export interface TabletStatusPayload {
  battery_level: number | null
  network_type: string | null
  network_rssi: number | null
}

export interface HeartbeatDeviceStatus {
  tablet: TabletStatusPayload | null
  ecg: SensorStatusPayload | null
  spo2: SensorStatusPayload | null
  temp: SensorStatusPayload | null
}

export interface HeartbeatSSEMessage {
  event: "heartbeat"
  bed_id: string
  tablet_id: string
  device_status: HeartbeatDeviceStatus | null
}

export interface EncounterAdmittedSSEMessage {
  event: "admitted"
  encounter_id: string
  patient_id: string
  bed_id: string
}

export interface EncounterDischargedSSEMessage {
  event: "discharged"
  encounter_id: string
  bed_id: string
}

export type EncounterSSEMessage = EncounterAdmittedSSEMessage | EncounterDischargedSSEMessage

export interface MonitorConfigChangedSSEMessage {
  event: "config_changed"
  monitor_id: string
}

export interface StationConfigChangedSSEMessage {
  event: "config_changed"
  station_id: string
}

export type ConfigChangedSSEMessage = MonitorConfigChangedSSEMessage | StationConfigChangedSSEMessage

interface UseSSEOptions<T> {
  path: string
  // Connect only when enabled. Defaults to true for backward compat.
  // Use to gate connection on auth/resource availability (e.g. tablet needs bed_id).
  enabled?: boolean
  onSnapshot: (data: T) => void
  onVitals?: (data: VitalsSSEMessage) => void
  onAlarm?: (data: AlarmSSEMessage) => void
  onEcg?: (data: EcgSSEMessage) => void
  onHeartbeat?: (data: HeartbeatSSEMessage) => void
  onEncounter?: (data: EncounterSSEMessage) => void
  onConfigChanged?: (data: ConfigChangedSSEMessage) => void
}

export function useSSE<T>({
  path,
  enabled = true,
  onSnapshot,
  onVitals,
  onAlarm,
  onEcg,
  onHeartbeat,
  onEncounter,
  onConfigChanged,
}: UseSSEOptions<T>) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  // connect self-references inside setTimeout (retry) — break the cycle via ref
  // so lint doesn't flag "accessed before declared" and retries always call the latest.
  const connectRef = useRef<() => void>(() => {})

  const onSnapshotRef = useRef(onSnapshot)
  const onVitalsRef = useRef(onVitals)
  const onAlarmRef = useRef(onAlarm)
  const onEcgRef = useRef(onEcg)
  const onHeartbeatRef = useRef(onHeartbeat)
  const onEncounterRef = useRef(onEncounter)
  const onConfigChangedRef = useRef(onConfigChanged)

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
      onVitalsRef.current?.(JSON.parse(e.data) as VitalsSSEMessage)
    })

    es.addEventListener("alarms", (e) => {
      onAlarmRef.current?.(JSON.parse(e.data) as AlarmSSEMessage)
    })

    es.addEventListener("ecg", (e) => {
      onEcgRef.current?.(JSON.parse(e.data) as EcgSSEMessage)
    })

    es.addEventListener("heartbeat", (e) => {
      onHeartbeatRef.current?.(JSON.parse(e.data) as HeartbeatSSEMessage)
    })

    es.addEventListener("encounter", (e) => {
      onEncounterRef.current?.(JSON.parse(e.data) as EncounterSSEMessage)
    })

    es.addEventListener("config", (e) => {
      onConfigChangedRef.current?.(JSON.parse(e.data) as ConfigChangedSSEMessage)
    })

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false)
        es.close()
        esRef.current = null

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1
          setError(`Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`)
          reconnectTimer.current = setTimeout(() => connectRef.current(), RECONNECT_INTERVAL)
        } else {
          setError("Connection lost. Please refresh the page.")
        }
      }
    }
  }, [path])

  // Latest-callback refs & connectRef update after render (react-hooks/refs: no writes during render).
  useEffect(() => {
    onSnapshotRef.current = onSnapshot
    onVitalsRef.current = onVitals
    onAlarmRef.current = onAlarm
    onEcgRef.current = onEcg
    onHeartbeatRef.current = onHeartbeat
    onEncounterRef.current = onEncounter
    onConfigChangedRef.current = onConfigChanged
    connectRef.current = connect
  })

  // Explicit reconnect so consumers can force a fresh snapshot after encounter
  // or config_changed events (admitted needs patient lookup, config changes may
  // alter bed assignments/layout).
  const reconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    reconnectAttempts.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    if (!enabled) {
      // When disabled mid-session (e.g. logout), tear down any live stream.
      // Cascading render here is intentional — UI needs `connected: false` to reflect disabled state.
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null }
      if (esRef.current) { esRef.current.close(); esRef.current = null }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
      setConnected(false)
      return
    }
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (esRef.current) esRef.current.close()
      esRef.current = null
    }
  }, [connect, enabled])

  return { connected, error, reconnect }
}

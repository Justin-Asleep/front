"use client"

import { useRef, useState } from "react"
import {
  useSSE,
  type HeartbeatSSEMessage,
  type SensorStatusPayload,
} from "@/hooks/use-sse"
import type { ActiveAlarm, RealtimeBed, SensorStatus, TabletStatus } from "@/types/monitor"

// 12초 rolling window = 화면 6초 + SSE 버스트/rAF 드롭 대비 6초 헤드룸.
// 헤드룸이 없으면 displayed가 received보다 뒤처지는 순간 샘플이 evict되어 sweep에 갭 발생.
const ECG_WINDOW_SECONDS = 60
// 직전 onEcg 수신으로부터 이 시간 이상 경과 시 새 세션으로 간주 — existing samples와
// merge하지 않고 total_received를 리셋해서 EcgWaveform이 lag<0 으로 감지 후 cursor 재초기화.
const ECG_GAP_RESET_MS = 5000

function mergeSensor(
  prev: SensorStatus | null,
  next: SensorStatusPayload | null | undefined,
): SensorStatus | null {
  if (!next) return prev
  return {
    connected: next.connected,
    battery_level: next.battery_level,
    signal_quality: next.signal_quality,
  }
}

function mergeTabletFromHeartbeat(
  prev: TabletStatus | null,
  update: HeartbeatSSEMessage,
): TabletStatus | null {
  // Snapshot이 아직 도착하지 않았거나 bed에 태블릿이 할당돼 있지 않으면 드롭.
  // Heartbeat 단독으로는 serial_number/is_active를 알 수 없어 TabletStatus를 새로 만들 수 없음.
  if (!prev) return prev
  const ds = update.device_status
  return {
    ...prev,
    is_online: true,
    last_event: "heartbeat",
    battery: ds?.tablet?.battery_level ?? prev.battery,
    ecg: mergeSensor(prev.ecg, ds?.ecg),
    spo2: mergeSensor(prev.spo2, ds?.spo2),
    temp: mergeSensor(prev.temp, ds?.temp),
  }
}

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }

function highestAlarmMessage(alarms: Record<string, ActiveAlarm>): string | null {
  const entries = Object.values(alarms)
  if (entries.length === 0) return null
  return entries.reduce((worst, a) =>
    (SEVERITY_ORDER[a.severity] ?? 0) > (SEVERITY_ORDER[worst.severity] ?? 0) ? a : worst,
  ).message
}

function clearBedOnDischarge(bed: RealtimeBed): RealtimeBed {
  return {
    ...bed,
    encounter_id: null,
    patient_name: null,
    patient_gender: null,
    patient_age: null,
    vitals: null,
    ecg: null,
    alarm_message: null,
    active_alarms: {},
  }
}

export function useBedRealtimeSSE<T extends { beds: RealtimeBed[] }>(path: string) {
  const [data, setData] = useState<T | null>(null)
  // Per-bed 마지막 onEcg 수신 시각 추적 (gap 검출용)
  const lastEcgAtRef = useRef(new Map<string, number>())

  const { connected, error, reconnect } = useSSE<T>({
    path,
    // Baseline 파형 주입 금지: flat line 은 임상적으로 asystole 패턴이므로
    // 데이터가 도착하기 전까지는 EcgWaveform 컴포넌트의 placeholder 만 노출.
    onSnapshot: (snapshot) => setData(snapshot),
    onVitals: (update) => {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
            const vitals = { ...(bed.vitals ?? {}) } as Record<string, unknown>
            const t = update.type
            if (t === "HR") vitals.hr = update.value
            else if (t === "SPO2") vitals.spo2 = update.value
            else if (t === "RR") vitals.rr = update.value
            else if (t === "TEMP") vitals.temp = update.value
            else if (t === "BP") {
              vitals.bp_systolic = update.value
              vitals.bp_diastolic = update.extra_value
              const s = update.value
              const d = update.extra_value
              vitals.bp_mean = s != null && d != null ? Math.round(((s + 2 * d) / 3) * 10) / 10 : null
            }
            return { ...bed, vitals: vitals as unknown as typeof bed.vitals }
          }),
        } as T
      })
    },
    onAlarm: (update) => {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
            const alarms = { ...(bed.active_alarms ?? {}) }
            if (update.event === "alarm_triggered") {
              alarms[update.param] = {
                severity: update.severity,
                value: update.value,
                message: update.message,
              }
            } else {
              delete alarms[update.param]
            }
            return { ...bed, active_alarms: alarms, alarm_message: highestAlarmMessage(alarms) }
          }),
        } as T
      })
    },
    onEcg: (update) => {
      const bedId = update.bed_id
      if (!bedId) return

      // Gap 검출: 첫 수신(lastEcgAt===0)은 reset에서 제외
      const now = Date.now()
      const lastEcgAt = lastEcgAtRef.current.get(bedId) ?? 0
      const isGapReset = lastEcgAt > 0 && now - lastEcgAt >= ECG_GAP_RESET_MS
      lastEcgAtRef.current.set(bedId, now)

      setData((prev) => {
        if (!prev) return prev
        const newSamples = update.samples
        const sampleRate = update.sample_rate_hz
        const maxSamples = sampleRate * ECG_WINDOW_SECONDS
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || bedId !== bed.bed_id) return bed
            // Gap reset 시: existing 무시, total_received 도 newSamples.length 부터 새로 시작.
            // 일반 수신 시: existing과 merge, total_received 누적.
            const samples = isGapReset
              ? newSamples.slice(-maxSamples)
              : [...(bed.ecg?.samples ?? []), ...newSamples].slice(-maxSamples)
            const totalReceived = isGapReset
              ? newSamples.length
              : (bed.ecg?.total_received ?? 0) + newSamples.length
            return {
              ...bed,
              ecg: {
                samples,
                sample_rate_hz: sampleRate,
                measured_at: update.measured_at,
                total_received: totalReceived,
              },
            }
          }),
        } as T
      })
    },
    onHeartbeat: (update) => {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
            return { ...bed, tablet: mergeTabletFromHeartbeat(bed.tablet, update) }
          }),
        } as T
      })
    },
    onEncounter: (update) => {
      if (update.event === "discharged") {
        // Local clear — 퇴원 직후 이전 환자 정보가 잠깐이라도 남는 것을 방지.
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            beds: prev.beds.map((bed) =>
              bed.bed_id && update.bed_id === bed.bed_id ? clearBedOnDischarge(bed) : bed,
            ),
          } as T
        })
        return
      }
      // admitted: 메시지에는 patient_id/encounter_id만 있어 patient_name/age 등을 복원할 수 없음 → 스냅샷 재요청.
      reconnect()
    },
    onConfigChanged: () => {
      // Monitor/Station layout 또는 bed 할당 변경 → 전체 스냅샷 재요청이 가장 안전.
      reconnect()
    },
  })

  return { data, connected, error }
}

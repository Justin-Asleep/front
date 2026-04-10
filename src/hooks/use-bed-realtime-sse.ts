"use client"

import { useState } from "react"
import { useSSE } from "@/hooks/use-sse"
import type { RealtimeBed } from "@/types/monitor"

// 12초 rolling window = 화면 6초 + SSE 버스트/rAF 드롭 대비 6초 헤드룸.
// 헤드룸이 없으면 displayed가 received보다 뒤처지는 순간 샘플이 evict되어 sweep에 갭 발생.
const ECG_WINDOW_SECONDS = 12

export function useBedRealtimeSSE<T extends { beds: RealtimeBed[] }>(path: string) {
  const [data, setData] = useState<T | null>(null)

  const { connected, error } = useSSE<T>({
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
            const t = update.type as string
            if (t === "HR") vitals.hr = update.value
            else if (t === "SPO2") vitals.spo2 = update.value
            else if (t === "RR") vitals.rr = update.value
            else if (t === "TEMP") vitals.temp = update.value
            else if (t === "BP") {
              vitals.bp_systolic = update.value
              vitals.bp_diastolic = update.extra_value
              const s = update.value as number
              const d = update.extra_value as number
              vitals.bp_mean = s && d ? Math.round(((s + 2 * d) / 3) * 10) / 10 : null
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
          beds: prev.beds.map((bed) =>
            bed.bed_id && update.bed_id === bed.bed_id
              ? { ...bed, alarm_message: update.message as string }
              : bed
          ),
        } as T
      })
    },
    onEcg: (update) => {
      setData((prev) => {
        if (!prev) return prev
        const newSamples = update.samples as number[]
        const sampleRate = update.sample_rate_hz as number
        const maxSamples = sampleRate * ECG_WINDOW_SECONDS
        return {
          ...prev,
          beds: prev.beds.map((bed) => {
            if (!bed.bed_id || update.bed_id !== bed.bed_id) return bed
            const existing = bed.ecg?.samples ?? []
            const merged = [...existing, ...newSamples].slice(-maxSamples)
            const totalReceived = (bed.ecg?.total_received ?? 0) + newSamples.length
            return {
              ...bed,
              ecg: {
                samples: merged,
                sample_rate_hz: sampleRate,
                measured_at: update.measured_at as string,
                total_received: totalReceived,
              },
            }
          }),
        } as T
      })
    },
  })

  return { data, connected, error }
}

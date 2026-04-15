"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  isAlarmAudioUnlocked,
  playAlarmLoop,
  resumeAlarmAudio,
  speakAlarm,
  stopAlarm,
  unlockAlarmAudio,
} from "@/lib/alarm-sound"
import type { ActiveAlarm, RealtimeBed } from "@/types/monitor"

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }
// CRITICAL speech 재안내 간격. ack/종료 시 자동 중단되고, 재발생 시 즉시 안내 재개.
const SPEECH_REPEAT_MS = 15_000

function alarmSignature(alarms: Record<string, ActiveAlarm> | undefined): string {
  if (!alarms) return ""
  const keys = Object.keys(alarms).sort()
  if (keys.length === 0) return ""
  return keys.map((k) => `${k}:${alarms[k].severity}`).join("|")
}

function topSeverity(alarms: Record<string, ActiveAlarm> | undefined): Severity | null {
  if (!alarms) return null
  const entries = Object.values(alarms)
  if (entries.length === 0) return null
  const top = entries.reduce((worst, a) =>
    (SEVERITY_ORDER[a.severity] ?? 0) > (SEVERITY_ORDER[worst.severity] ?? 0) ? a : worst,
  )
  return (top.severity as Severity) ?? null
}

export function useAlarmSound(beds: RealtimeBed[] | undefined) {
  const [ackedSigs, setAckedSigs] = useState<Record<number, string>>({})

  // unacked 알람 중 최고 severity + speech 대상 CRITICAL bed 계산.
  const { highest, announceTargets } = useMemo(() => {
    let highest: Severity | null = null
    const announceTargets: RealtimeBed[] = []
    if (!beds) return { highest, announceTargets }
    for (const bed of beds) {
      const sig = alarmSignature(bed.active_alarms)
      if (!sig) continue
      if (ackedSigs[bed.position] === sig) continue
      const sev = topSeverity(bed.active_alarms)
      if (!sev) continue
      if (!highest || SEVERITY_ORDER[sev] > SEVERITY_ORDER[highest]) highest = sev
      if (sev === "CRITICAL") announceTargets.push(bed)
    }
    return { highest, announceTargets }
  }, [beds, ackedSigs])

  // severity 변화에 따라 루프 재생/정지.
  useEffect(() => {
    if (highest) playAlarmLoop(highest)
    else stopAlarm()
  }, [highest])

  // Ack 상태 pruning — 현재 signature와 일치하지 않는 entry는 제거해서
  // 알람이 종료되었다가 같은 조건으로 재발생할 때 ack이 유지되지 않도록 한다.
  useEffect(() => {
    if (!beds) return
    setAckedSigs((prev) => {
      const keys = Object.keys(prev)
      if (keys.length === 0) return prev
      const bedSig = new Map<number, string>()
      for (const bed of beds) bedSig.set(bed.position, alarmSignature(bed.active_alarms))
      let changed = false
      const next: Record<number, string> = {}
      for (const k of keys) {
        const pos = Number(k)
        const sig = bedSig.get(pos) ?? ""
        if (sig !== "" && sig === prev[pos]) next[pos] = prev[pos]
        else changed = true
      }
      return changed ? next : prev
    })
  }, [beds])

  // 언마운트 시 반드시 정지.
  useEffect(() => {
    return () => stopAlarm()
  }, [])

  // Speech 안내: unacked CRITICAL이 유지되는 동안 SPEECH_REPEAT_MS 주기로 반복.
  // ack/종료되면 announceTargets에서 빠져 자동 중단되고, lastSpokenRef도 prune되어
  // 같은 신호가 재발생하면 즉시 다시 안내된다.
  const lastSpokenRef = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const speakDue = () => {
      const now = Date.now()
      const activeKeys = new Set<string>()
      for (const bed of announceTargets) {
        const sig = alarmSignature(bed.active_alarms)
        const key = `${bed.position}:${sig}`
        activeKeys.add(key)
        const last = lastSpokenRef.current.get(key) ?? 0
        if (now - last < SPEECH_REPEAT_MS) continue
        lastSpokenRef.current.set(key, now)
        const label = bed.bed_label ?? `position ${bed.position}`
        speakAlarm(`Bed ${label}, critical alarm`)
      }
      for (const k of lastSpokenRef.current.keys()) {
        if (!activeKeys.has(k)) lastSpokenRef.current.delete(k)
      }
    }
    speakDue()
    const id = setInterval(speakDue, SPEECH_REPEAT_MS)
    return () => clearInterval(id)
  }, [announceTargets])

  // 첫 클릭/터치 시 자동 unlock — 직접 URL로 진입한 경우 safety net.
  useEffect(() => {
    if (isAlarmAudioUnlocked()) return
    const handler = () => {
      unlockAlarmAudio()
      document.removeEventListener("click", handler)
      document.removeEventListener("touchstart", handler)
    }
    document.addEventListener("click", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("click", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [])

  // 탭 복귀 시 AudioContext가 suspended면 resume.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") resumeAlarmAudio()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  const ackBed = useCallback((bed: RealtimeBed) => {
    const sig = alarmSignature(bed.active_alarms)
    if (!sig) return
    setAckedSigs((prev) => ({ ...prev, [bed.position]: sig }))
  }, [])

  const isBedAcked = useCallback(
    (bed: RealtimeBed) => {
      const sig = alarmSignature(bed.active_alarms)
      return sig !== "" && ackedSigs[bed.position] === sig
    },
    [ackedSigs],
  )

  return { ackBed, isBedAcked }
}

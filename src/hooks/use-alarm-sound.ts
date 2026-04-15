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

  // 언마운트 시 반드시 정지.
  useEffect(() => {
    return () => stopAlarm()
  }, [])

  // Speech 안내: (bed, alarm signature) 조합당 1회.
  const announcedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const bed of announceTargets) {
      const sig = alarmSignature(bed.active_alarms)
      const key = `${bed.position}:${sig}`
      if (announcedRef.current.has(key)) continue
      announcedRef.current.add(key)
      const label = bed.bed_label ?? `position ${bed.position}`
      speakAlarm(`Bed ${label}, critical alarm`)
    }
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

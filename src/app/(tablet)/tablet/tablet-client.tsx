"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSSE } from "@/hooks/use-sse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plug, Unplug, Send,
  Hospital, Terminal, LogOut, Wifi, ChevronRight,
  Heart, Thermometer, Activity, BedDouble, Stethoscope, User, Battery,
} from "lucide-react"

// ── Constants ────────────────────────────────────────────────────────────────
const INGEST_URL = process.env.NEXT_PUBLIC_INGEST_URL || "http://localhost:8001"
const HEARTBEAT_INTERVAL = 30_000
const ECG_INTERVAL = 1_000      // 250Hz 연속 파형, 1s chunk
const HR_INTERVAL = 2_000       // ECG 센서의 맥박수 — 1~2s 주기
const SPO2_INTERVAL = 2_000     // Pulse Ox — SpO2 + RR 1~2s 주기
const TEMP_INTERVAL = 30_000    // Skin patch — 체온은 천천히 변함
const BP_INTERVAL = 300_000     // NIBP 커프 — 이벤트성, 5~15min 주기

interface ApiLog {
  id: number
  label: string
  method: string
  url: string
  request: unknown
  response: unknown
  status: number | null
  error: string | null
  timestamp: string
}

interface SensorState {
  connected: boolean
  battery_level: number
  signal_quality: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number, dec = 0) {
  return Number((min + Math.random() * (max - min)).toFixed(dec))
}

// Alarm test values — just past each threshold boundary
const ALARM_PRESETS: { vital: string; label: string; level: string; color: string; value: number; extra?: number }[] = [
  // HR (sensor: ecg)
  { vital: "HR", label: "HR↓", level: "High",     color: "bg-[#f97316]", value: 48 },
  { vital: "HR", label: "HR↓↓", level: "Critical", color: "bg-[#dc2626]", value: 38 },
  { vital: "HR", label: "HR↑", level: "High",     color: "bg-[#f97316]", value: 125 },
  { vital: "HR", label: "HR↑↑", level: "Critical", color: "bg-[#dc2626]", value: 155 },
  // SPO2 (sensor: spo2)
  { vital: "SPO2", label: "SpO2↓", level: "High",     color: "bg-[#f97316]", value: 88 },
  { vital: "SPO2", label: "SpO2↓↓", level: "Critical", color: "bg-[#dc2626]", value: 83 },
  // RR (sensor: spo2)
  { vital: "RR", label: "RR↓", level: "High",     color: "bg-[#f97316]", value: 8 },
  { vital: "RR", label: "RR↓↓", level: "Critical", color: "bg-[#dc2626]", value: 5 },
  { vital: "RR", label: "RR↑", level: "High",     color: "bg-[#f97316]", value: 27 },
  { vital: "RR", label: "RR↑↑", level: "Critical", color: "bg-[#dc2626]", value: 37 },
  // TEMP (sensor: temp)
  { vital: "TEMP", label: "T↓", level: "High",     color: "bg-[#f97316]", value: 35.3 },
  { vital: "TEMP", label: "T↓↓", level: "Critical", color: "bg-[#dc2626]", value: 33.5 },
  { vital: "TEMP", label: "T↑", level: "High",     color: "bg-[#f97316]", value: 38.5 },
  { vital: "TEMP", label: "T↑↑", level: "Critical", color: "bg-[#dc2626]", value: 40.5 },
  // BP (sensor: bp)
  { vital: "BP", label: "BP↓", level: "High",     color: "bg-[#f97316]", value: 88, extra: 58 },
  { vital: "BP", label: "BP↓↓", level: "Critical", color: "bg-[#dc2626]", value: 68, extra: 38 },
  { vital: "BP", label: "BP↑", level: "High",     color: "bg-[#f97316]", value: 145, extra: 92 },
  { vital: "BP", label: "BP↑↑", level: "Critical", color: "bg-[#dc2626]", value: 185, extra: 122 },
]

async function callIngest(
  method: string, path: string, body: unknown, headers: Record<string, string> = {},
): Promise<{ data: unknown; status: number; error: string | null }> {
  try {
    const res = await fetch(`${INGEST_URL}${path}`, {
      method, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    return { data, status: res.status, error: res.ok ? null : (data?.message || `HTTP ${res.status}`) }
  } catch (e) {
    return { data: null, status: 0, error: (e as Error).message }
  }
}

// 1초 분량의 사람 ECG 파형 생성 (250Hz, ~72 BPM)
// P파 → Q → R(피크) → S → T파 → 평평한 baseline 패턴 반복
function generateEcgSamples(count = 250, bpm = 72): number[] {
  const samplesPerBeat = Math.round((60 / bpm) * 250) // 한 박동 샘플 수
  const baseline = 512

  // 박동 템플릿 (PQRST + isoelectric) — 0.0~1.0 정규화된 시간 내 위치
  const template = (t: number): number => {
    // P wave (작은 양성 bump): 0.1~0.2
    if (t >= 0.10 && t <= 0.20) {
      const x = (t - 0.15) / 0.05
      return 25 * Math.exp(-x * x * 4)
    }
    // Q (작은 음성): 0.28~0.32
    if (t >= 0.28 && t <= 0.32) {
      const x = (t - 0.30) / 0.02
      return -30 * Math.exp(-x * x * 4)
    }
    // R (큰 양성 피크): 0.32~0.38
    if (t >= 0.32 && t <= 0.38) {
      const x = (t - 0.35) / 0.015
      return 350 * Math.exp(-x * x * 6)
    }
    // S (중간 음성): 0.38~0.42
    if (t >= 0.38 && t <= 0.42) {
      const x = (t - 0.40) / 0.02
      return -80 * Math.exp(-x * x * 4)
    }
    // T wave (중간 양성 bump): 0.50~0.70
    if (t >= 0.50 && t <= 0.70) {
      const x = (t - 0.60) / 0.08
      return 60 * Math.exp(-x * x * 3)
    }
    return 0
  }

  return Array.from({ length: count }, (_, i) => {
    const beatProgress = (i % samplesPerBeat) / samplesPerBeat
    const signal = template(beatProgress)
    const noise = (Math.random() - 0.5) * 8
    return Math.round((baseline + signal + noise) * 10) / 10
  })
}


// ── Bedside (default) View Helpers ───────────────────────────────────────────

interface LoginInfo {
  bed_id: string | null
  encounter_id: string | null
  bed_label?: string | null
  ward_name?: string | null
  room_name?: string | null
  patient_name?: string | null
  patient_age?: number | null
  patient_gender?: string | null
}

interface DisplayVitals {
  hr: number | null
  spo2: number | null
  rr: number | null
  temp: number | null
  bpSys: number | null
  bpDia: number | null
}

function ClockDisplay() {
  const [time, setTime] = useState<string>("")
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums font-semibold text-slate-100">{time || "--:--"}</span>
}

function VitalCard({ label, unit, value, connected, Icon, accentColor, children }: {
  label: string
  unit: string
  value: string | null
  connected: boolean
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accentColor: string
  children?: React.ReactNode
}) {
  const numberColor = connected ? accentColor : "#475569"
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-colors h-full flex flex-col justify-between",
      connected ? "bg-slate-900/80 border-slate-700" : "bg-slate-900/40 border-slate-800",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3.5" style={{ color: accentColor }} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
        {!connected && (
          <span className="text-[9px] font-medium bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">
            Off
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className="font-bold tabular-nums leading-none text-[clamp(2.5rem,8vw,5rem)]"
          style={{ color: numberColor }}
          aria-label={`${label} ${connected && value ? `${value} ${unit}` : "not available"}`}
        >
          {connected && value != null ? value : "—"}
        </span>
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
      </div>
      {children}
    </div>
  )
}

function SensorChip({ name, connected, battery }: { name: string; connected: boolean; battery: number | null }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
      connected ? "border-emerald-800 bg-emerald-950/50 text-emerald-300" : "border-slate-800 bg-slate-900/50 text-slate-500",
    )}>
      <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-400" : "bg-slate-600")} />
      <span className="font-semibold">{name}</span>
      {connected && battery != null && (
        <span className="text-[10px] text-emerald-400/80 tabular-nums">{battery}%</span>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

function loadSession() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("tablet_session")
    return raw ? JSON.parse(raw) as { serial: string; deviceToken: string; loginInfo: LoginInfo } : null
  } catch { return null }
}

export function TabletSampleClient() {
  // Auth — defer localStorage read to avoid hydration mismatch
  const [serial, setSerial] = useState("")
  const [secret, setSecret] = useState("")
  const [deviceToken, setDeviceToken] = useState("")
  const [loginInfo, setLoginInfo] = useState<LoginInfo | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // QR auto-login: ?serial=...&secret=... overrides any saved session
    const params = new URLSearchParams(window.location.search)
    const qrSerial = params.get("serial")
    const qrSecret = params.get("secret")
    if (qrSerial && qrSecret) {
      setSerial(qrSerial)
      setSecret(qrSecret)
      void loginWithCredsRef.current?.(qrSerial, qrSecret)
      // Scrub URL so secret doesn't linger in history
      window.history.replaceState({}, "", window.location.pathname)
    } else {
      const saved = loadSession()
      if (saved) {
        setSerial(saved.serial)
        setDeviceToken(saved.deviceToken)
        setLoginInfo(saved.loginInfo)
      }
    }
    setHydrated(true)
  }, [])

  // Sensors
  const [ecg, setEcg] = useState<SensorState>({ connected: false, battery_level: 80, signal_quality: 90 })
  const [spo2, setSpo2] = useState<SensorState>({ connected: false, battery_level: 85, signal_quality: 95 })
  const [temp, setTemp] = useState<SensorState>({ connected: false, battery_level: 70, signal_quality: 80 })
  const [bp, setBp] = useState<SensorState>({ connected: false, battery_level: 75, signal_quality: 85 })

  // Tablet
  const [tabletBattery, setTabletBattery] = useState(90)

  // Manual vitals override
  const [manualMode, setManualMode] = useState(false)
  const [manualHr, setManualHr] = useState(75)
  const [manualSpo2, setManualSpo2] = useState(98)
  const [manualRr, setManualRr] = useState(16)
  const [manualTemp, setManualTemp] = useState(36.5)
  const [manualBpSys, setManualBpSys] = useState(120)
  const [manualBpDia, setManualBpDia] = useState(70)

  // Auto-send
  const [autoHeartbeat, setAutoHeartbeat] = useState(false)
  const [autoEcg, setAutoEcg] = useState(false)
  const [autoSpo2, setAutoSpo2] = useState(false)
  const [autoTemp, setAutoTemp] = useState(false)
  const [autoBp, setAutoBp] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ecgRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hrRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spo2Ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const tempRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bpRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // View toggle (default bedside vs debug simulator)
  const [viewMode, setViewMode] = useState<"default" | "debug">("default")

  // Display vitals — what the bedside screen shows; updated by each send
  const [displayVitals, setDisplayVitals] = useState<DisplayVitals>({
    hr: null, spo2: null, rr: null, temp: null, bpSys: null, bpDia: null,
  })

  // Logs
  const [logs, setLogs] = useState<ApiLog[]>([])
  const logCounterRef = useRef(0)

  const isLoggedIn = !!deviceToken

  const addLog = useCallback((label: string, method: string, url: string, request: unknown, response: unknown, status: number | null, error: string | null) => {
    logCounterRef.current += 1
    const id = logCounterRef.current
    setLogs(l => [{ id, label, method, url, request, response, status, error, timestamp: new Date().toLocaleTimeString() }, ...l].slice(0, 50))
  }, [])

  const handleLogout = useCallback(() => {
    setDeviceToken("")
    setLoginInfo(null)
    setAutoHeartbeat(false); setAutoEcg(false); setAutoSpo2(false); setAutoTemp(false); setAutoBp(false)
    setViewMode("default")
    setDisplayVitals({ hr: null, spo2: null, rr: null, temp: null, bpSys: null, bpDia: null })
    localStorage.removeItem("tablet_session")
  }, [])

  // ── API calls ──

  const loginWithCreds = useCallback(async (s: string, sec: string) => {
    if (!s || !sec) return
    const body = { serial_number: s, device_secret: sec }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/login", body)
    addLog("Login", "POST", "/ingest/v1/login", body, data, status, error)
    if (!error && data) {
      const result = (data as { data: LoginInfo & { device_token: string } }).data
      const info: LoginInfo = {
        bed_id: result.bed_id,
        encounter_id: result.encounter_id,
        bed_label: result.bed_label ?? null,
        ward_name: result.ward_name ?? null,
        room_name: result.room_name ?? null,
        patient_name: result.patient_name ?? null,
        patient_age: result.patient_age ?? null,
        patient_gender: result.patient_gender ?? null,
      }
      setDeviceToken(result.device_token)
      setLoginInfo(info)
      localStorage.setItem("tablet_session", JSON.stringify({ serial: s, deviceToken: result.device_token, loginInfo: info }))
    } else {
      toast.error("로그인 실패", { description: error ?? `HTTP ${status}` })
    }
  }, [addLog])

  // Hold a stable ref so the mount-only auto-login effect can call the latest version
  const loginWithCredsRef = useRef(loginWithCreds)
  useEffect(() => { loginWithCredsRef.current = loginWithCreds }, [loginWithCreds])

  const handleLogin = () => loginWithCreds(serial, secret)

  const sendHeartbeat = useCallback(async () => {
    if (!deviceToken) return
    const body = {
      device_status: {
        tablet: { battery_level: tabletBattery, network_type: "wifi", network_rssi: rand(-80, -30) },
        ecg: ecg.connected ? { connected: true, battery_level: ecg.battery_level, signal_quality: ecg.signal_quality } : { connected: false },
        spo2: spo2.connected ? { connected: true, battery_level: spo2.battery_level, signal_quality: spo2.signal_quality } : { connected: false },
        temp: temp.connected ? { connected: true, battery_level: temp.battery_level, signal_quality: temp.signal_quality } : { connected: false },
        bp: bp.connected ? { connected: true, battery_level: bp.battery_level, signal_quality: bp.signal_quality } : { connected: false },
      },
    }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/heartbeat", body, { "X-Device-Token": deviceToken })
    addLog("Heartbeat", "POST", "/ingest/v1/heartbeat", body, data, status, error)
    if (status === 401) handleLogout()
  }, [deviceToken, tabletBattery, ecg, spo2, temp, bp, addLog, handleLogout])

  type Observation = { type: string; value: number; extra_value: number | null; measured_at: string }

  const postObservations = useCallback(async (label: string, observations: Observation[]) => {
    if (!deviceToken) return
    const body = { observations }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/observations", body, { "X-Device-Token": deviceToken })
    addLog(label, "POST", "/ingest/v1/observations", body, data, status, error)
    if (status === 401) handleLogout()
  }, [deviceToken, addLog, handleLogout])

  const sendHr = useCallback(async () => {
    if (!ecg.connected) return
    const hr = manualMode ? manualHr : rand(65, 95)
    setDisplayVitals(v => ({ ...v, hr }))
    await postObservations("HR", [{ type: "HR", value: hr, extra_value: null, measured_at: new Date().toISOString() }])
  }, [ecg.connected, manualMode, manualHr, postObservations])

  const sendSpo2 = useCallback(async () => {
    if (!spo2.connected) return
    const spo2v = manualMode ? manualSpo2 : rand(96, 100)
    const rrv = manualMode ? manualRr : rand(14, 20)
    setDisplayVitals(v => ({ ...v, spo2: spo2v, rr: rrv }))
    const now = new Date().toISOString()
    await postObservations("SpO2/RR", [
      { type: "SPO2", value: spo2v, extra_value: null, measured_at: now },
      { type: "RR", value: rrv, extra_value: null, measured_at: now },
    ])
  }, [spo2.connected, manualMode, manualSpo2, manualRr, postObservations])

  const sendTemp = useCallback(async () => {
    if (!temp.connected) return
    const t = manualMode ? manualTemp : rand(36.0, 36.9, 1)
    setDisplayVitals(v => ({ ...v, temp: t }))
    await postObservations("TEMP", [{ type: "TEMP", value: t, extra_value: null, measured_at: new Date().toISOString() }])
  }, [temp.connected, manualMode, manualTemp, postObservations])

  const sendBp = useCallback(async () => {
    if (!bp.connected) return
    const sys = manualMode ? manualBpSys : rand(115, 130)
    const dia = manualMode ? manualBpDia : rand(70, 82)
    setDisplayVitals(v => ({ ...v, bpSys: sys, bpDia: dia }))
    await postObservations("BP", [{ type: "BP", value: sys, extra_value: dia, measured_at: new Date().toISOString() }])
  }, [bp.connected, manualMode, manualBpSys, manualBpDia, postObservations])

  const sendEcg = useCallback(async () => {
    if (!deviceToken || !ecg.connected) return
    const body = { waveforms: [{ measured_at: new Date().toISOString(), samples: generateEcgSamples(), sample_rate_hz: 250 }] }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/ecg", body, { "X-Device-Token": deviceToken })
    addLog("ECG", "POST", "/ingest/v1/ecg", body, data, status, error)
    if (status === 401) handleLogout()
  }, [deviceToken, ecg.connected, addLog, handleLogout])

  const sendAlarmTest = useCallback(async (preset: typeof ALARM_PRESETS[number]) => {
    if (!deviceToken) return
    const now = new Date().toISOString()
    const body = {
      observations: [{
        type: preset.vital,
        value: preset.value,
        extra_value: preset.extra ?? null,
        measured_at: now,
      }],
    }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/observations", body, { "X-Device-Token": deviceToken })
    addLog(`Alarm ${preset.label}`, "POST", "/ingest/v1/observations", body, data, status, error)
    if (status === 401) handleLogout()
  }, [deviceToken, addLog, handleLogout])

  // ── Bed state SSE ──
  // After login, subscribe to this bed's stream so admission/discharge events
  // update the bedside display in real time. Snapshot hydrates ward/room/patient
  // info the login response may not carry.
  const persistSession = useCallback((info: LoginInfo) => {
    try {
      localStorage.setItem("tablet_session", JSON.stringify({ serial, deviceToken, loginInfo: info }))
    } catch { /* storage quota/disabled */ }
  }, [serial, deviceToken])

  // Auto-publish orchestration: on first snapshot with a patient (or on admission),
  // pretend all sensors are connected and start every auto-publish stream in randomized mode.
  const autoStartedForEncounterRef = useRef<string | null>(null)

  const autoStartPublish = useCallback(() => {
    setEcg(s => ({ ...s, connected: true }))
    setSpo2(s => ({ ...s, connected: true }))
    setTemp(s => ({ ...s, connected: true }))
    setBp(s => ({ ...s, connected: true }))
    setManualMode(false)
    setAutoHeartbeat(true)
    setAutoEcg(true)
    setAutoSpo2(true)
    setAutoTemp(true)
    setAutoBp(true)
  }, [])

  const autoStopPublish = useCallback(() => {
    setAutoHeartbeat(false)
    setAutoEcg(false)
    setAutoSpo2(false)
    setAutoTemp(false)
    setAutoBp(false)
  }, [])

  const { reconnect: reconnectBedSSE } = useSSE<Partial<LoginInfo>>({
    path: loginInfo?.bed_id ? `/sse/bed/${loginInfo.bed_id}` : "",
    enabled: isLoggedIn && !!loginInfo?.bed_id,
    onSnapshot: (snap) => {
      setLoginInfo((prev) => {
        if (!prev) return prev
        const next: LoginInfo = { ...prev, ...snap }
        persistSession(next)
        return next
      })
      // Patient assigned and we haven't auto-started for this encounter yet → kick off publishing.
      if (snap.encounter_id && autoStartedForEncounterRef.current !== snap.encounter_id) {
        autoStartedForEncounterRef.current = snap.encounter_id
        autoStartPublish()
      }
    },
    onEncounter: (ev) => {
      if (ev.event === "admitted") {
        // New patient assigned — pull a fresh snapshot so patient_name/age/gender land.
        reconnectBedSSE()
      } else if (ev.event === "discharged") {
        setLoginInfo((prev) => {
          if (!prev) return prev
          const next: LoginInfo = {
            ...prev,
            encounter_id: null,
            patient_name: null,
            patient_age: null,
            patient_gender: null,
          }
          persistSession(next)
          return next
        })
        setDisplayVitals({ hr: null, spo2: null, rr: null, temp: null, bpSys: null, bpDia: null })
        autoStartedForEncounterRef.current = null
        autoStopPublish()
      }
    },
  })

  // ── Auto timers ──

  useEffect(() => {
    if (autoHeartbeat && isLoggedIn) {
      sendHeartbeat()
      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    }
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [autoHeartbeat, isLoggedIn, sendHeartbeat])

  // ECG 패치 = 파형(1s) + HR observation(2s) 동시 게시
  useEffect(() => {
    if (autoEcg && isLoggedIn && ecg.connected) {
      const h1 = setTimeout(sendEcg, 0)
      const h2 = setTimeout(sendHr, 0)
      ecgRef.current = setInterval(sendEcg, ECG_INTERVAL)
      hrRef.current = setInterval(sendHr, HR_INTERVAL)
      return () => {
        clearTimeout(h1); clearTimeout(h2)
        if (ecgRef.current) clearInterval(ecgRef.current)
        if (hrRef.current) clearInterval(hrRef.current)
      }
    }
  }, [autoEcg, isLoggedIn, ecg.connected, sendEcg, sendHr])

  useEffect(() => {
    if (autoSpo2 && isLoggedIn && spo2.connected) {
      const h = setTimeout(sendSpo2, 0)
      spo2Ref.current = setInterval(sendSpo2, SPO2_INTERVAL)
      return () => { clearTimeout(h); if (spo2Ref.current) clearInterval(spo2Ref.current) }
    }
  }, [autoSpo2, isLoggedIn, spo2.connected, sendSpo2])

  useEffect(() => {
    if (autoTemp && isLoggedIn && temp.connected) {
      const h = setTimeout(sendTemp, 0)
      tempRef.current = setInterval(sendTemp, TEMP_INTERVAL)
      return () => { clearTimeout(h); if (tempRef.current) clearInterval(tempRef.current) }
    }
  }, [autoTemp, isLoggedIn, temp.connected, sendTemp])

  useEffect(() => {
    if (autoBp && isLoggedIn && bp.connected) {
      const h = setTimeout(sendBp, 0)
      bpRef.current = setInterval(sendBp, BP_INTERVAL)
      return () => { clearTimeout(h); if (bpRef.current) clearInterval(bpRef.current) }
    }
  }, [autoBp, isLoggedIn, bp.connected, sendBp])

  // ── Render ──

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center">
        <p className="text-[#808099]">Loading...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Tablet API Sample</h1>
            <p className="text-sm text-[#808099] mt-1">태블릿 디바이스로 로그인합니다.</p>
          </div>
          <div className="rounded-xl bg-[#0a0b1a] border border-[#1e1f35] p-6 space-y-4">
            <Input placeholder="Serial Number (e.g. TAB-001)" value={serial} onChange={e => setSerial(e.target.value)} className="bg-[#111] border-[#333] text-white" />
            <Input placeholder="Device Secret" value={secret} onChange={e => setSecret(e.target.value)} className="bg-[#111] border-[#333] text-white" />
            <Button onClick={handleLogin} disabled={!serial || !secret} className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]">
              Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Default (Bedside) View ──────────────────────────────────────────────
  if (viewMode === "default") {
    const bpText = displayVitals.bpSys != null && displayVitals.bpDia != null
      ? `${displayVitals.bpSys}/${displayVitals.bpDia}`
      : null
    const patientLabel = loginInfo?.patient_name ?? "— 환자 미배정 —"
    const patientMeta = [
      loginInfo?.patient_age != null ? `${loginInfo.patient_age}세` : null,
      loginInfo?.patient_gender ?? null,
    ].filter(Boolean).join(" · ")

    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
        {/* Top bar — ward/room/bed breadcrumb + status */}
        <header className="shrink-0 bg-slate-900/70 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs" aria-label="병상 위치">
            <Hospital className="size-3.5 text-cyan-400" aria-hidden />
            <span className="text-slate-300">{loginInfo?.ward_name ?? "병동 정보 없음"}</span>
            <ChevronRight className="size-3 text-slate-600" aria-hidden />
            <span className="text-slate-300">{loginInfo?.room_name ?? "—"}</span>
            <ChevronRight className="size-3 text-slate-600" aria-hidden />
            <span className="inline-flex items-center gap-1 font-semibold text-slate-100">
              <BedDouble className="size-3.5 text-cyan-400" aria-hidden />
              {loginInfo?.bed_label ?? loginInfo?.bed_id ?? "—"}
            </span>
          </nav>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <ClockDisplay />
            <span className="inline-flex items-center gap-1" aria-label="네트워크 상태">
              <Wifi className="size-3.5 text-cyan-400" aria-hidden />
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums" aria-label={`태블릿 배터리 ${tabletBattery}%`}>
              <Battery className="size-3.5 text-emerald-400" aria-hidden /> {tabletBattery}%
            </span>
          </div>
        </header>

        {/* Main — patient identity + vitals; fills remaining viewport */}
        <main className="flex-1 min-h-0 p-3 flex flex-col gap-3">
          {/* Patient identity */}
          <section className="shrink-0 bg-slate-900/60 rounded-xl border border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <User className="size-5 text-cyan-400" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">환자</div>
                  <div className="text-xl font-bold text-slate-50 truncate">{patientLabel}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {patientMeta || "정보 없음"}
                    {loginInfo?.encounter_id && (
                      <span className="ml-1.5 text-slate-600">· Enc {loginInfo.encounter_id.slice(0, 8)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">병상</div>
                <div className="text-xl font-bold text-cyan-400 tabular-nums">
                  {loginInfo?.bed_label ?? "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Vitals — grid fills remaining height */}
          <section className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-3" aria-label="바이탈 사인">
            <VitalCard
              label="Heart Rate" unit="bpm" Icon={Heart} accentColor="#FB7185"
              value={displayVitals.hr != null ? String(displayVitals.hr) : null}
              connected={ecg.connected}
            />
            <VitalCard
              label="SpO₂" unit="%" Icon={Activity} accentColor="#22D3EE"
              value={displayVitals.spo2 != null ? String(displayVitals.spo2) : null}
              connected={spo2.connected}
            />
            <VitalCard
              label="Respiratory Rate" unit="/min" Icon={Activity} accentColor="#34D399"
              value={displayVitals.rr != null ? String(displayVitals.rr) : null}
              connected={spo2.connected}
            />
            <VitalCard
              label="Temperature" unit="°C" Icon={Thermometer} accentColor="#FBBF24"
              value={displayVitals.temp != null ? String(displayVitals.temp) : null}
              connected={temp.connected}
            />
            <div className="col-span-2">
              <VitalCard
                label="Blood Pressure" unit="mmHg" Icon={Stethoscope} accentColor="#818CF8"
                value={bpText}
                connected={bp.connected}
              >
              </VitalCard>
            </div>
          </section>

          {/* Sensor chips */}
          <section className="shrink-0 flex items-center gap-2 flex-wrap" aria-label="센서 연결 상태">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1">센서</span>
            <SensorChip name="ECG" connected={ecg.connected} battery={ecg.connected ? ecg.battery_level : null} />
            <SensorChip name="SpO₂" connected={spo2.connected} battery={spo2.connected ? spo2.battery_level : null} />
            <SensorChip name="Temp" connected={temp.connected} battery={temp.connected ? temp.battery_level : null} />
            <SensorChip name="BP" connected={bp.connected} battery={bp.connected ? bp.battery_level : null} />
          </section>
        </main>

        {/* Bottom bar — debug / logout */}
        <footer className="shrink-0 bg-slate-900/70 backdrop-blur border-t border-slate-800 px-4 py-2 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("debug")}
            className="min-h-[40px] gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <Terminal className="size-3.5" aria-hidden /> Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="min-h-[40px] gap-1.5 border-rose-900 bg-rose-950/40 text-rose-300 hover:bg-rose-950 hover:text-rose-200 cursor-pointer"
          >
            <LogOut className="size-3.5" aria-hidden /> Logout
          </Button>
        </footer>
      </div>
    )
  }

  // ── Debug (Developer Simulator) View ────────────────────────────────────
  const sensorList = [
    { key: "ecg" as const, name: "ECG", state: ecg, setter: setEcg },
    { key: "spo2" as const, name: "SpO₂", state: spo2, setter: setSpo2 },
    { key: "temp" as const, name: "Temp", state: temp, setter: setTemp },
    { key: "bp" as const, name: "BP", state: bp, setter: setBp },
  ]

  const publisherList: Array<{
    key: string
    name: string
    source: string
    interval: string
    auto: boolean
    onAutoToggle: () => void
    onSend: () => void
    canRun: boolean
  }> = [
    { key: "hb", name: "Heartbeat", source: "tablet", interval: "30s",
      auto: autoHeartbeat, onAutoToggle: () => setAutoHeartbeat(v => !v),
      onSend: sendHeartbeat, canRun: true },
    { key: "ecg", name: "ECG waveform + HR", source: "ecg sensor", interval: "1s / 2s",
      auto: autoEcg, onAutoToggle: () => setAutoEcg(v => !v),
      onSend: () => { sendEcg(); sendHr() }, canRun: ecg.connected },
    { key: "spo2", name: "SpO₂ + RR", source: "spo2 sensor", interval: "2s",
      auto: autoSpo2, onAutoToggle: () => setAutoSpo2(v => !v),
      onSend: sendSpo2, canRun: spo2.connected },
    { key: "temp", name: "Temp", source: "temp sensor", interval: "30s",
      auto: autoTemp, onAutoToggle: () => setAutoTemp(v => !v),
      onSend: sendTemp, canRun: temp.connected },
    { key: "bp", name: "NIBP", source: "bp sensor", interval: "5m (event)",
      auto: autoBp, onAutoToggle: () => setAutoBp(v => !v),
      onSend: sendBp, canRun: bp.connected },
  ]

  const manualInputs = [
    { label: "HR", value: manualHr, onChange: setManualHr, unit: "bpm", min: 20, max: 250, step: 1 },
    { label: "SpO₂", value: manualSpo2, onChange: setManualSpo2, unit: "%", min: 50, max: 100, step: 1 },
    { label: "RR", value: manualRr, onChange: setManualRr, unit: "/min", min: 4, max: 60, step: 1 },
    { label: "Temp", value: manualTemp, onChange: setManualTemp, unit: "°C", min: 34, max: 42, step: 0.1 },
    { label: "BP sys", value: manualBpSys, onChange: setManualBpSys, unit: "mmHg", min: 60, max: 250, step: 1 },
    { label: "BP dia", value: manualBpDia, onChange: setManualBpDia, unit: "mmHg", min: 30, max: 150, step: 1 },
  ]

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar — same shape as bedside, with Debug badge */}
      <header className="shrink-0 bg-slate-900/70 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Terminal className="size-3.5 text-amber-400" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Debug</span>
          </div>
          <span className="text-xs text-slate-600">|</span>
          <nav className="flex items-center gap-1.5 text-xs font-mono" aria-label="병상 위치">
            <span className="text-slate-400">{loginInfo?.ward_name ?? "—"}</span>
            <ChevronRight className="size-3 text-slate-600" aria-hidden />
            <span className="text-slate-400">{loginInfo?.room_name ?? "—"}</span>
            <ChevronRight className="size-3 text-slate-600" aria-hidden />
            <span className="text-slate-200 font-semibold">{loginInfo?.bed_label ?? loginInfo?.bed_id ?? "—"}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <ClockDisplay />
          <span className="inline-flex items-center gap-1" aria-label="네트워크">
            <Wifi className="size-3.5 text-cyan-400" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Battery className="size-3.5 text-emerald-400" aria-hidden /> {tabletBattery}%
          </span>
        </div>
      </header>

      {/* Main: left controls column + right activity log column */}
      <main className="flex-1 min-h-0 p-3 grid grid-cols-[minmax(0,1fr)_360px] gap-3 overflow-hidden">
        {/* ─ Left column: sensors, publishers, vitals, alarms ─ */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pr-1">
          {/* Device + Sensors panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Device & Sensors</h2>
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]" title={deviceToken}>
                {serial} · {deviceToken.slice(0, 12)}…
              </span>
            </div>
            {/* Tablet battery slider */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800/70">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 w-14">Tablet</span>
              <div className="flex-1 flex items-center gap-2">
                <Battery className="size-3.5 text-emerald-400" aria-hidden />
                <span className="text-[10px] text-slate-500">Battery</span>
                <Input
                  type="number" min={0} max={100}
                  value={tabletBattery}
                  onChange={e => setTabletBattery(Number(e.target.value))}
                  className="h-7 w-16 bg-slate-950 border-slate-700 text-slate-100 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 ml-2">Network</span>
                <span className="text-xs text-slate-300 font-mono">WiFi</span>
              </div>
            </div>
            {/* Sensor rows */}
            <div className="divide-y divide-slate-800/70">
              {sensorList.map(({ key, name, state, setter }) => (
                <div key={key} className="flex items-center gap-3 py-2">
                  <span className={cn("size-2 rounded-full shrink-0",
                    state.connected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-slate-700")} />
                  <span className="text-xs font-semibold text-slate-200 w-14">{name}</span>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setter(s => ({ ...s, connected: !s.connected }))}
                    className={cn("h-7 text-[10px] px-2 min-w-[80px] cursor-pointer",
                      state.connected
                        ? "border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800",
                    )}
                  >
                    {state.connected ? <Plug className="size-3" /> : <Unplug className="size-3" />}
                    {state.connected ? "Connected" : "Off"}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-slate-500">BAT</label>
                    <Input
                      type="number" min={0} max={100}
                      value={state.battery_level}
                      onChange={e => setter(s => ({ ...s, battery_level: Number(e.target.value) }))}
                      className="h-7 w-14 bg-slate-950 border-slate-700 text-slate-100 text-[11px] font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-slate-500">SIG</label>
                    <Input
                      type="number" min={0} max={100}
                      value={state.signal_quality}
                      onChange={e => setter(s => ({ ...s, signal_quality: Number(e.target.value) }))}
                      className="h-7 w-14 bg-slate-950 border-slate-700 text-slate-100 text-[11px] font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Publishers panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Publishers</h2>
            <div className="divide-y divide-slate-800/70">
              {/* eslint-disable-next-line react-hooks/refs -- list entries capture callbacks that transitively reach logCounterRef, but refs are only touched at event time, not during render */}
              {publisherList.map(p => (
                <div key={p.key} className={cn("flex items-center gap-3 py-2", !p.canRun && "opacity-50")}>
                  <span className={cn("size-2 rounded-full shrink-0",
                    p.auto && p.canRun ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-slate-700")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{p.source}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums w-16 text-right">{p.interval}</span>
                  <Button
                    size="sm" onClick={p.onSend} disabled={!p.canRun}
                    className="h-7 text-[10px] px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="size-3" /> Send
                  </Button>
                  <Button
                    size="sm" variant="outline" onClick={p.onAutoToggle} disabled={!p.canRun}
                    className={cn("h-7 text-[10px] px-2.5 min-w-[60px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                      p.auto
                        ? "border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800")}
                  >
                    {p.auto ? "Stop" : "Auto"}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Manual Vitals panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Vital Values</h2>
              <Button
                size="sm" variant="outline"
                onClick={() => setManualMode(!manualMode)}
                className={cn("h-7 text-[10px] px-2.5 cursor-pointer",
                  manualMode
                    ? "border-amber-800 bg-amber-950/40 text-amber-300 hover:bg-amber-950"
                    : "border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-950",
                )}
              >
                {manualMode ? "Manual" : "Randomized"}
              </Button>
            </div>
            <div className={cn("grid grid-cols-6 gap-2", !manualMode && "opacity-50 pointer-events-none")}>
              {manualInputs.map(({ label, value, onChange, unit, min, max, step }) => (
                <div key={label} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                  <div className="text-[9px] text-slate-500 flex items-center justify-between">
                    <span className="font-semibold text-slate-400">{label}</span>
                    <span className="text-slate-600 font-mono">{unit}</span>
                  </div>
                  <Input
                    type="number" min={min} max={max} step={step}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="h-7 bg-transparent border-0 p-0 text-slate-100 text-sm font-mono tabular-nums focus-visible:ring-0"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Alarm presets panel */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Alarm Presets</h2>
            <div className="grid grid-cols-5 gap-2">
              {(["HR", "SPO2", "RR", "TEMP", "BP"] as const).map(vital => {
                const presets = ALARM_PRESETS.filter(p => p.vital === vital)
                return (
                  <div key={vital} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1.5">{vital}</div>
                    <div className="flex flex-wrap gap-1">
                      {presets.map(p => (
                        <button
                          key={p.label}
                          onClick={() => sendAlarmTest(p)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold text-white transition-opacity hover:opacity-80 cursor-pointer",
                            p.color,
                          )}
                          title={`${p.vital} = ${p.value}${p.extra != null ? `/${p.extra}` : ""} (${p.level})`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ─ Right column: activity log ─ */}
        <aside className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col min-h-0">
          <header className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">Activity Log</h2>
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">{logs.length}</span>
            </div>
            <Button
              size="sm" variant="outline"
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
              className="h-6 text-[10px] px-2 border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 cursor-pointer disabled:opacity-40"
            >
              Clear
            </Button>
          </header>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
            {logs.length === 0 ? (
              <p className="text-[11px] font-mono text-slate-600 text-center mt-4">No requests yet.</p>
            ) : logs.map(log => (
              <details
                key={log.id}
                className={cn(
                  "group font-mono text-[10px] rounded border-l-2 pl-2 pr-2 py-1.5 bg-slate-950/40",
                  log.error ? "border-rose-500" : "border-emerald-500",
                )}
              >
                <summary className="flex items-center gap-2 cursor-pointer list-none">
                  <span className="text-slate-500 tabular-nums shrink-0">{log.timestamp}</span>
                  <span className={cn("font-bold shrink-0", log.error ? "text-rose-400" : "text-emerald-400")}>
                    {log.method}
                  </span>
                  <span className="text-slate-300 truncate flex-1">{log.label}</span>
                  <span className={cn("ml-auto shrink-0 tabular-nums", log.error ? "text-rose-400" : "text-slate-400")}>
                    {log.error ? "ERR" : log.status}
                  </span>
                </summary>
                <div className="mt-1.5 pl-1 text-slate-500 space-y-1">
                  <div className="truncate"><span className="text-slate-600">url</span> {log.url}</div>
                  {log.error && <div className="text-rose-400">{log.error}</div>}
                  <details>
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">request</summary>
                    <pre className="text-slate-400 whitespace-pre-wrap break-all text-[9px] mt-1">{JSON.stringify(log.request, null, 2)}</pre>
                  </details>
                  <details>
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">response</summary>
                    <pre className="text-slate-400 whitespace-pre-wrap break-all text-[9px] mt-1">{JSON.stringify(log.response, null, 2)}</pre>
                  </details>
                </div>
              </details>
            ))}
          </div>
        </aside>
      </main>

      {/* Bottom bar — matches bedside footer shape */}
      <footer className="shrink-0 bg-slate-900/70 backdrop-blur border-t border-slate-800 px-4 py-2 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode("default")}
          className="min-h-[40px] gap-1.5 border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 cursor-pointer"
        >
          <BedDouble className="size-3.5" aria-hidden /> Bedside
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="min-h-[40px] gap-1.5 border-rose-900 bg-rose-950/40 text-rose-300 hover:bg-rose-950 hover:text-rose-200 cursor-pointer"
        >
          <LogOut className="size-3.5" aria-hidden /> Logout
        </Button>
      </footer>
    </div>
  )
}

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Plug, Unplug, Send, Activity } from "lucide-react"

// ── Constants ────────────────────────────────────────────────────────────────
const INGEST_URL = process.env.NEXT_PUBLIC_INGEST_URL || "http://localhost:8001"
const HEARTBEAT_INTERVAL = 30_000
const OBSERVATION_INTERVAL = 10_000
const ECG_INTERVAL = 1_000

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

// ── Sensor Card ──────────────────────────────────────────────────────────────

function SensorCard({ name, sensor, onToggle, onBatteryChange, onSignalChange }: {
  name: string
  sensor: SensorState
  onToggle: () => void
  onBatteryChange: (v: number) => void
  onSignalChange: (v: number) => void
}) {
  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3 transition-colors",
      sensor.connected ? "bg-[#0a1a0a] border-[#1a3a1a]" : "bg-[#0a0b1a] border-[#1e1f35]"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{name}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggle}
          className={cn(
            "h-7 text-xs gap-1",
            sensor.connected
              ? "border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10"
              : "border-[#555] text-[#555] hover:bg-[#555]/10"
          )}
        >
          {sensor.connected ? <Plug className="size-3" /> : <Unplug className="size-3" />}
          {sensor.connected ? "Connected" : "Disconnected"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[#808099]">Battery %</label>
          <Input
            type="number" min={0} max={100}
            value={sensor.battery_level}
            onChange={e => onBatteryChange(Number(e.target.value))}
            className="h-7 bg-[#111] border-[#333] text-white text-xs mt-1"
          />
        </div>
        <div>
          <label className="text-[#808099]">Signal %</label>
          <Input
            type="number" min={0} max={100}
            value={sensor.signal_quality}
            onChange={e => onSignalChange(Number(e.target.value))}
            className="h-7 bg-[#111] border-[#333] text-white text-xs mt-1"
          />
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

function loadSession() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("tablet_session")
    return raw ? JSON.parse(raw) as { serial: string; deviceToken: string; loginInfo: { bed_id: string | null; encounter_id: string | null } } : null
  } catch { return null }
}

export function TabletSampleClient() {
  // Auth — defer localStorage read to avoid hydration mismatch
  const [serial, setSerial] = useState("")
  const [secret, setSecret] = useState("")
  const [deviceToken, setDeviceToken] = useState("")
  const [loginInfo, setLoginInfo] = useState<{ bed_id: string | null; encounter_id: string | null } | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setSerial(saved.serial)
      setDeviceToken(saved.deviceToken)
      setLoginInfo(saved.loginInfo)
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
  const [autoObservation, setAutoObservation] = useState(false)
  const [autoEcg, setAutoEcg] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const observationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ecgRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Logs
  const [logs, setLogs] = useState<ApiLog[]>([])
  const logCounterRef = useRef(0)
  const [logsExpanded, setLogsExpanded] = useState(true)

  const isLoggedIn = !!deviceToken

  const addLog = useCallback((label: string, method: string, url: string, request: unknown, response: unknown, status: number | null, error: string | null) => {
    logCounterRef.current += 1
    const id = logCounterRef.current
    setLogs(l => [{ id, label, method, url, request, response, status, error, timestamp: new Date().toLocaleTimeString() }, ...l].slice(0, 50))
  }, [])

  // ── API calls ──

  async function handleLogin() {
    if (!serial || !secret) return
    const body = { serial_number: serial, device_secret: secret }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/login", body)
    addLog("Login", "POST", "/ingest/v1/login", body, data, status, error)
    if (!error && data) {
      const result = (data as { data: { device_token: string; bed_id: string | null; encounter_id: string | null } }).data
      setDeviceToken(result.device_token)
      setLoginInfo({ bed_id: result.bed_id, encounter_id: result.encounter_id })
      localStorage.setItem("tablet_session", JSON.stringify({ serial, deviceToken: result.device_token, loginInfo: { bed_id: result.bed_id, encounter_id: result.encounter_id } }))
    }
  }

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
  }, [deviceToken, tabletBattery, ecg, spo2, temp, bp, addLog])

  const sendObservation = useCallback(async () => {
    if (!deviceToken) return
    const now = new Date().toISOString()
    const observations: { type: string; value: number; extra_value: number | null; measured_at: string }[] = []

    if (ecg.connected) observations.push({ type: "HR", value: manualMode ? manualHr : rand(60, 100), extra_value: null, measured_at: now })
    if (spo2.connected) {
      observations.push({ type: "SPO2", value: manualMode ? manualSpo2 : rand(94, 100), extra_value: null, measured_at: now })
      observations.push({ type: "RR", value: manualMode ? manualRr : rand(12, 22), extra_value: null, measured_at: now })
    }
    if (temp.connected) observations.push({ type: "TEMP", value: manualMode ? manualTemp : rand(36.0, 38.0, 1), extra_value: null, measured_at: now })
    if (bp.connected) observations.push({ type: "BP", value: manualMode ? manualBpSys : rand(110, 140), extra_value: manualMode ? manualBpDia : rand(60, 80), measured_at: now })

    if (observations.length === 0) {
      addLog("Observation", "POST", "/ingest/v1/observations", {}, null, null, "No sensors connected")
      return
    }

    const body = { observations }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/observations", body, { "X-Device-Token": deviceToken })
    addLog("Observation", "POST", "/ingest/v1/observations", body, data, status, error)
  }, [deviceToken, ecg.connected, spo2.connected, temp.connected, bp.connected, manualMode, manualHr, manualSpo2, manualRr, manualTemp, manualBpSys, manualBpDia, addLog])

  const sendEcg = useCallback(async () => {
    if (!deviceToken || !ecg.connected) return
    const body = { waveforms: [{ measured_at: new Date().toISOString(), samples: generateEcgSamples(), sample_rate_hz: 250 }] }
    const { data, status, error } = await callIngest("POST", "/ingest/v1/ecg", body, { "X-Device-Token": deviceToken })
    addLog("ECG", "POST", "/ingest/v1/ecg", body, data, status, error)
  }, [deviceToken, ecg.connected, addLog])

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
  }, [deviceToken, addLog])

  // ── Auto timers ──

  useEffect(() => {
    if (autoHeartbeat && isLoggedIn) {
      sendHeartbeat()
      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
    }
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [autoHeartbeat, isLoggedIn, sendHeartbeat])

  useEffect(() => {
    if (autoObservation && isLoggedIn) {
      sendObservation()
      observationRef.current = setInterval(sendObservation, OBSERVATION_INTERVAL)
    }
    return () => { if (observationRef.current) clearInterval(observationRef.current) }
  }, [autoObservation, isLoggedIn, sendObservation])

  useEffect(() => {
    if (autoEcg && isLoggedIn && ecg.connected) {
      sendEcg()
      ecgRef.current = setInterval(sendEcg, ECG_INTERVAL)
    }
    return () => { if (ecgRef.current) clearInterval(ecgRef.current) }
  }, [autoEcg, isLoggedIn, ecg.connected, sendEcg])

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
          {/* Login logs */}
          {logs.length > 0 && (
            <div className="rounded-xl bg-[#0a0b1a] border border-[#1e1f35] p-4">
              {logs.map(log => (
                <div key={log.id} className={cn("text-xs font-mono", log.error ? "text-[#f87171]" : "text-[#4ade80]")}>
                  [{log.timestamp}] {log.error || `${log.status} OK`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tablet Dashboard</h1>
          <p className="text-xs text-[#808099] mt-1">
            {serial} &middot; bed: {loginInfo?.bed_id ?? "—"} &middot; encounter: {loginInfo?.encounter_id ?? "—"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setDeviceToken(""); setAutoHeartbeat(false); setAutoObservation(false); setAutoEcg(false); localStorage.removeItem("tablet_session") }} className="border-[#333] text-[#808099] hover:text-white">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Sensors */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[#808099] uppercase tracking-wider">Sensors</h2>
          <div className="grid grid-cols-4 gap-3">
            <SensorCard name="ECG" sensor={ecg}
              onToggle={() => setEcg(s => ({ ...s, connected: !s.connected }))}
              onBatteryChange={v => setEcg(s => ({ ...s, battery_level: v }))}
              onSignalChange={v => setEcg(s => ({ ...s, signal_quality: v }))}
            />
            <SensorCard name="SpO2" sensor={spo2}
              onToggle={() => setSpo2(s => ({ ...s, connected: !s.connected }))}
              onBatteryChange={v => setSpo2(s => ({ ...s, battery_level: v }))}
              onSignalChange={v => setSpo2(s => ({ ...s, signal_quality: v }))}
            />
            <SensorCard name="Temp" sensor={temp}
              onToggle={() => setTemp(s => ({ ...s, connected: !s.connected }))}
              onBatteryChange={v => setTemp(s => ({ ...s, battery_level: v }))}
              onSignalChange={v => setTemp(s => ({ ...s, signal_quality: v }))}
            />
            <SensorCard name="BP" sensor={bp}
              onToggle={() => setBp(s => ({ ...s, connected: !s.connected }))}
              onBatteryChange={v => setBp(s => ({ ...s, battery_level: v }))}
              onSignalChange={v => setBp(s => ({ ...s, signal_quality: v }))}
            />
          </div>

          {/* Vitals Mode */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-semibold text-[#808099] uppercase tracking-wider">Vitals Values</h2>
            <Button
              size="sm" variant="outline"
              onClick={() => setManualMode(!manualMode)}
              className={cn(
                "h-7 text-xs gap-1",
                manualMode ? "border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b]/10" : "border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10",
              )}
            >
              {manualMode ? "Manual" : "Auto (Normal)"}
            </Button>
          </div>
          {manualMode && (
            <div className="grid grid-cols-6 gap-2">
              {[
                { label: "HR", value: manualHr, onChange: setManualHr, unit: "bpm", min: 20, max: 250 },
                { label: "SpO2", value: manualSpo2, onChange: setManualSpo2, unit: "%", min: 50, max: 100 },
                { label: "RR", value: manualRr, onChange: setManualRr, unit: "/min", min: 4, max: 60 },
                { label: "Temp", value: manualTemp, onChange: setManualTemp, unit: "°C", min: 34, max: 42, step: 0.1 },
                { label: "BP sys", value: manualBpSys, onChange: setManualBpSys, unit: "mmHg", min: 60, max: 250 },
                { label: "BP dia", value: manualBpDia, onChange: setManualBpDia, unit: "mmHg", min: 30, max: 150 },
              ].map(({ label, value, onChange, unit, min, max, step }) => (
                <div key={label} className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-2.5">
                  <label className="text-[10px] text-[#808099]">{label} <span className="text-[#555]">{unit}</span></label>
                  <Input
                    type="number" min={min} max={max} step={step ?? 1}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="h-7 bg-[#111] border-[#333] text-white text-xs mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Alarm Test Buttons */}
          <h2 className="text-sm font-semibold text-[#808099] uppercase tracking-wider pt-2">Alarm Test</h2>
          <div className="grid grid-cols-2 gap-2">
            {(["HR", "SPO2", "RR", "TEMP", "BP"] as const).map(vital => {
              const presets = ALARM_PRESETS.filter(p => p.vital === vital)
              return (
                <div key={vital} className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-2.5">
                  <span className="text-[10px] font-semibold text-[#808099]">{vital}</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {presets.map(p => (
                      <button
                        key={p.label}
                        onClick={() => sendAlarmTest(p)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold text-white transition-opacity hover:opacity-80 cursor-pointer",
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

          {/* Actions */}
          <h2 className="text-sm font-semibold text-[#808099] uppercase tracking-wider pt-2">Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Heartbeat */}
            <div className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Heartbeat</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full", autoHeartbeat ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#333] text-[#808099]")}>
                  {autoHeartbeat ? "AUTO 30s" : "MANUAL"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={sendHeartbeat} className="flex-1 h-8 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] gap-1">
                  <Send className="size-3" /> Send
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAutoHeartbeat(!autoHeartbeat)}
                  className={cn("h-8 text-xs", autoHeartbeat ? "border-[#22c55e] text-[#22c55e]" : "border-[#333] text-[#808099]")}>
                  {autoHeartbeat ? "Stop" : "Auto"}
                </Button>
              </div>
            </div>

            {/* Observation */}
            <div className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Observation</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full", autoObservation ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#333] text-[#808099]")}>
                  {autoObservation ? "AUTO 10s" : "MANUAL"}
                </span>
              </div>
              <p className="text-[10px] text-[#808099]">
                {[ecg.connected && "HR", spo2.connected && "SPO2/RR", temp.connected && "TEMP", bp.connected && "BP"].filter(Boolean).join(", ") || "No sensors"}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={sendObservation} className="flex-1 h-8 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] gap-1">
                  <Activity className="size-3" /> Send
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAutoObservation(!autoObservation)}
                  className={cn("h-8 text-xs", autoObservation ? "border-[#22c55e] text-[#22c55e]" : "border-[#333] text-[#808099]")}>
                  {autoObservation ? "Stop" : "Auto"}
                </Button>
              </div>
            </div>

            {/* ECG */}
            <div className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">ECG Waveform</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full", autoEcg ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#333] text-[#808099]")}>
                  {autoEcg ? "AUTO 1s" : "MANUAL"}
                </span>
              </div>
              <p className="text-[10px] text-[#808099]">250Hz, 1s sample</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={sendEcg} disabled={!ecg.connected} className="flex-1 h-8 text-xs bg-[#2563eb] hover:bg-[#1d4ed8] gap-1">
                  <Send className="size-3" /> Send
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAutoEcg(!autoEcg)} disabled={!ecg.connected}
                  className={cn("h-8 text-xs", autoEcg ? "border-[#22c55e] text-[#22c55e]" : "border-[#333] text-[#808099]")}>
                  {autoEcg ? "Stop" : "Auto"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet Status */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#808099] uppercase tracking-wider">Tablet</h2>
          <div className="rounded-lg bg-[#0a0b1a] border border-[#1e1f35] p-4 space-y-3">
            <div>
              <label className="text-xs text-[#808099]">Battery %</label>
              <Input
                type="number" min={0} max={100}
                value={tabletBattery}
                onChange={e => setTabletBattery(Number(e.target.value))}
                className="h-8 bg-[#111] border-[#333] text-white text-sm mt-1"
              />
            </div>
            <div className="text-xs text-[#808099] space-y-1">
              <p>Network: <span className="text-white">WiFi</span></p>
              <p>Serial: <span className="text-white">{serial}</span></p>
              <p>Token: <span className="text-[#555] break-all">{deviceToken.slice(0, 20)}...</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* API Logs */}
      <div className="rounded-xl bg-[#0a0b1a] border border-[#1e1f35]">
        <button
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#808099] hover:text-white transition-colors"
        >
          <span>API Logs ({logs.length})</span>
          {logsExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {logsExpanded && (
          <div className="px-6 pb-4 space-y-2 max-h-[400px] overflow-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-[#555]">No API calls yet.</p>
            ) : logs.map(log => (
              <div key={log.id} className={cn("rounded-lg p-3 text-xs font-mono", log.error ? "bg-[#1a0a0a] border border-[#3a1a1a]" : "bg-[#0a1a0a] border border-[#1a3a1a]")}>
                <div className="flex items-center gap-2">
                  <span className={cn("font-semibold", log.error ? "text-[#f87171]" : "text-[#4ade80]")}>
                    [{log.timestamp}] {log.label}
                  </span>
                  <span className="text-[#808099]">{log.method} {log.url}</span>
                  <span className={cn("ml-auto", log.error ? "text-[#f87171]" : "text-[#4ade80]")}>
                    {log.error ? `Error: ${log.error}` : `${log.status} OK`}
                  </span>
                </div>
                <details className="text-[#808099] mt-1">
                  <summary className="cursor-pointer hover:text-white">Detail</summary>
                  <pre className="text-[#b2b2cc] whitespace-pre-wrap break-all mt-1 text-[10px]">{JSON.stringify(log.request, null, 2)}</pre>
                  <pre className="text-[#b2b2cc] whitespace-pre-wrap break-all mt-1 text-[10px]">{JSON.stringify(log.response, null, 2)}</pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

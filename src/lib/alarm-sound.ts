// Web Audio 기반 알람 사운드.
// Autoplay 정책: AudioContext는 user gesture 내에서 resume()해야 함 → unlockAlarmAudio() 제공.
// severity별 패턴은 IEC 60601-1-8 권장을 단순화한 버전.

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

interface Pulse {
  freq: number
  durationMs: number
}

interface Pattern {
  pulses: Pulse[]
  gapMs: number
  cycleMs: number
}

const PATTERNS: Partial<Record<Severity, Pattern>> = {
  CRITICAL: {
    pulses: [
      { freq: 988, durationMs: 150 },
      { freq: 784, durationMs: 150 },
      { freq: 988, durationMs: 150 },
    ],
    gapMs: 50,
    cycleMs: 1500,
  },
  HIGH: {
    pulses: [
      { freq: 660, durationMs: 200 },
      { freq: 880, durationMs: 200 },
    ],
    gapMs: 100,
    cycleMs: 3000,
  },
  MEDIUM: {
    pulses: [{ freq: 440, durationMs: 250 }],
    gapMs: 0,
    cycleMs: 8000,
  },
}

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null
let currentSeverity: Severity | null = null
let unlocked = false

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (ctx) return ctx
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  masterGain = ctx.createGain()
  masterGain.gain.value = 0.4
  masterGain.connect(ctx.destination)
  return ctx
}

export function unlockAlarmAudio() {
  const c = ensureCtx()
  if (!c) return
  if (c.state === "suspended") c.resume().catch(() => {})
  // iOS Safari: silent 1-sample buffer를 재생해야 완전 unlock.
  const buf = c.createBuffer(1, 1, 22050)
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(c.destination)
  src.start(0)
  unlocked = true
}

export function isAlarmAudioUnlocked(): boolean {
  return unlocked
}

export function resumeAlarmAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {})
}

function playPulse(startAt: number, pulse: Pulse) {
  if (!ctx || !masterGain) return
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.frequency.value = pulse.freq
  osc.type = "sine"
  const end = startAt + pulse.durationMs / 1000
  const FADE = 0.008
  env.gain.setValueAtTime(0, startAt)
  env.gain.linearRampToValueAtTime(1, startAt + FADE)
  env.gain.setValueAtTime(1, Math.max(end - FADE, startAt + FADE))
  env.gain.linearRampToValueAtTime(0, end)
  osc.connect(env).connect(masterGain)
  osc.start(startAt)
  osc.stop(end + 0.02)
}

function playCycle(severity: Severity) {
  if (!ctx) return
  const pattern = PATTERNS[severity]
  if (!pattern) return
  let t = ctx.currentTime + 0.01
  for (const p of pattern.pulses) {
    playPulse(t, p)
    t += p.durationMs / 1000 + pattern.gapMs / 1000
  }
}

export function playAlarmLoop(severity: Severity) {
  if (severity === "LOW") {
    stopAlarm()
    return
  }
  const c = ensureCtx()
  if (!c) return
  if (c.state === "suspended") c.resume().catch(() => {})
  if (currentSeverity === severity && loopTimer) return
  stopAlarm()
  const pattern = PATTERNS[severity]
  if (!pattern) return
  currentSeverity = severity
  playCycle(severity)
  loopTimer = setInterval(() => {
    if (currentSeverity) playCycle(currentSeverity)
  }, pattern.cycleMs)
}

export function stopAlarm() {
  if (loopTimer) {
    clearInterval(loopTimer)
    loopTimer = null
  }
  currentSeverity = null
}

export function speakAlarm(text: string) {
  if (typeof window === "undefined") return
  const synth = window.speechSynthesis
  if (!synth) return
  // 이전 큐가 쌓이면 계속 밀려서 말하므로 cancel 후 speak.
  synth.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 1.1
  utter.pitch = 1.0
  utter.volume = 1.0
  synth.speak(utter)
}

export function setAlarmVolume(v: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v))
}

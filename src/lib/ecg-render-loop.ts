// 전역 ECG 렌더 루프 — 모든 bed에 대해 단일 requestAnimationFrame
// 64+ beds 동시 렌더 시 성능 핵심: 개별 rAF 대신 공유 loop

export interface EcgRenderState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  getSamples: () => number[]
  getTargetCount: () => number
  getDisplayedCount: () => number
  setDisplayedCount: (v: number) => void
  lastCursorRef: { current: number }
}

const WIDTH = 476
const HEIGHT = 60
const DISPLAY_SAMPLES = 1500
const GAP_SAMPLES = 60
const SAMPLES_PER_SEC = 250

// Fixed vertical scale (clinical ECG convention — 10mm/mV 고정 gain)
const ECG_MIN = 200
const ECG_MAX = 900
const ECG_RANGE = ECG_MAX - ECG_MIN

const registered = new Set<EcgRenderState>()
let rafId = 0
let lastTime = 0

function loop() {
  const now = performance.now()
  const deltaSec = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  registered.forEach((state) => renderBed(state, deltaSec))

  if (registered.size > 0) {
    rafId = requestAnimationFrame(loop)
  } else {
    rafId = 0
  }
}

function renderBed(state: EcgRenderState, deltaSec: number) {
  const { ctx, getSamples, getTargetCount, getDisplayedCount, setDisplayedCount, lastCursorRef } = state
  const samples = getSamples()

  // displayedCount를 target까지 초당 250 samples 속도로 전진
  const target = getTargetCount()
  const displayed = getDisplayedCount()
  if (displayed < target) {
    setDisplayedCount(Math.min(displayed + SAMPLES_PER_SEC * deltaSec, target))
  }

  if (!samples || samples.length === 0) {
    // baseline line
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.strokeStyle = "#1e1f35"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, HEIGHT / 2)
    ctx.lineTo(WIDTH, HEIGHT / 2)
    ctx.stroke()
    return
  }

  const totalDisplayed = Math.floor(getDisplayedCount())
  const currentCursor = totalDisplayed % DISPLAY_SAMPLES
  const lastCursor = lastCursorRef.current

  // 첫 렌더 또는 wrap around 시 전체 재그리기
  if (lastCursor < 0 || currentCursor < lastCursor) {
    drawFullBuffer(ctx, samples, totalDisplayed, target, currentCursor)
  } else if (currentCursor > lastCursor) {
    // Dirty rectangle: [lastCursor+1, currentCursor+GAP+1] 구간만 다시 그림
    drawDirtyRegion(ctx, samples, totalDisplayed, target, lastCursor, currentCursor)
  }

  lastCursorRef.current = currentCursor
}

function sampleToY(v: number): number {
  // 클램핑
  const clamped = Math.max(ECG_MIN, Math.min(ECG_MAX, v))
  return HEIGHT - ((clamped - ECG_MIN) / ECG_RANGE) * HEIGHT
}

function cursorToX(cursorIdx: number): number {
  return (cursorIdx / DISPLAY_SAMPLES) * WIDTH
}

function getSampleAt(
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  bufferPos: number,
): number | null {
  // samples는 sliding window (최신 N개). totalReceived는 누적 수신 수.
  // samples[samples.length-1] = totalReceived-1 (최신)
  // samples[0] = totalReceived-samples.length (윈도우 시작)
  const cursor = totalDisplayed % DISPLAY_SAMPLES
  // offsetFromCursor: 0 = cursor(최신), 증가할수록 과거
  const offsetFromCursor = (cursor - bufferPos + DISPLAY_SAMPLES) % DISPLAY_SAMPLES
  const absoluteIdx = totalDisplayed - 1 - offsetFromCursor
  if (absoluteIdx < 0) return null
  const bufferStart = totalReceived - samples.length
  const arrIdx = absoluteIdx - bufferStart
  if (arrIdx < 0 || arrIdx >= samples.length) return null
  return samples[arrIdx]
}

function drawFullBuffer(
  ctx: CanvasRenderingContext2D,
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  cursor: number,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.strokeStyle = "#4ade80"
  ctx.lineWidth = 1.5

  const stepPx = WIDTH / DISPLAY_SAMPLES
  const gapStart = (cursor + 1) % DISPLAY_SAMPLES
  const gapEnd = (cursor + GAP_SAMPLES) % DISPLAY_SAMPLES

  ctx.beginPath()
  let penDown = false
  for (let i = 0; i < DISPLAY_SAMPLES; i++) {
    const inGap = gapStart <= gapEnd ? (i >= gapStart && i <= gapEnd) : (i >= gapStart || i <= gapEnd)
    if (inGap) {
      penDown = false
      continue
    }
    const v = getSampleAt(samples, totalDisplayed, totalReceived, i)
    if (v == null) {
      penDown = false
      continue
    }
    const x = i * stepPx
    const y = sampleToY(v)
    if (!penDown) {
      ctx.moveTo(x, y)
      penDown = true
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
}

function drawDirtyRegion(
  ctx: CanvasRenderingContext2D,
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  lastCursor: number,
  currentCursor: number,
) {
  const stepPx = WIDTH / DISPLAY_SAMPLES
  const dirtyStart = lastCursor + 1
  const dirtyEnd = Math.min(DISPLAY_SAMPLES, currentCursor + GAP_SAMPLES + 2)
  const dirtyX = dirtyStart * stepPx
  const dirtyW = (dirtyEnd - dirtyStart) * stepPx + 2

  ctx.clearRect(dirtyX - 1, 0, dirtyW, HEIGHT)

  ctx.strokeStyle = "#4ade80"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  let penDown = false
  for (let i = dirtyStart; i <= currentCursor; i++) {
    const v = getSampleAt(samples, totalDisplayed, totalReceived, i)
    if (v == null) {
      penDown = false
      continue
    }
    const x = i * stepPx
    const y = sampleToY(v)
    if (!penDown) {
      ctx.moveTo(x, y)
      penDown = true
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
}

export function registerEcgCanvas(state: EcgRenderState) {
  registered.add(state)
  if (rafId === 0) {
    lastTime = performance.now()
    rafId = requestAnimationFrame(loop)
  }
}

export function unregisterEcgCanvas(state: EcgRenderState) {
  registered.delete(state)
}

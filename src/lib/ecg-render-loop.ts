// 전역 ECG 렌더 루프 — 모든 bed에 대해 단일 requestAnimationFrame
// 64+ beds 동시 렌더 시 성능 핵심: 개별 rAF 대신 공유 loop

export interface EcgRenderState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number  // CSS pixels — drawing coord system (ctx는 DPR로 scaled)
  height: number // CSS pixels
  getSamples: () => number[]
  getTargetCount: () => number
  getDisplayedCount: () => number
  setDisplayedCount: (v: number) => void
}

const DISPLAY_SAMPLES = 1500
const GAP_SAMPLES = 30
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
  const { ctx, width, height, getSamples, getTargetCount, getDisplayedCount, setDisplayedCount } = state

  // ResizeObserver 첫 fire 전에는 backing store가 미확정 — skip
  if (width <= 0 || height <= 0) return

  // displayedCount를 target까지 초당 250 samples 속도로 전진
  const target = getTargetCount()
  const displayed = getDisplayedCount()
  if (displayed < target) {
    setDisplayedCount(Math.min(displayed + SAMPLES_PER_SEC * deltaSec, target))
  }

  // 샘플이 비어있으면 캔버스를 비워두고 끝 — flat line 은 asystole 패턴이라 금지.
  // placeholder UI 는 EcgWaveform 컴포넌트의 오버레이가 담당.
  const samples = getSamples()
  if (!samples || samples.length === 0) {
    ctx.clearRect(0, 0, width, height)
    return
  }

  // Full redraw per frame — dirty-rect의 erosion / seam / invisible-first-column
  // 엣지케이스를 근본 제거. 64 beds 기준 CPU 영향은 임상 모니터 HW에서 허용 범위.
  const totalDisplayed = Math.floor(getDisplayedCount())
  const cursor = totalDisplayed % DISPLAY_SAMPLES
  drawFullBuffer(ctx, width, height, samples, totalDisplayed, target, cursor)
}

function sampleToY(v: number, height: number): number {
  const clamped = Math.max(ECG_MIN, Math.min(ECG_MAX, v))
  return height - ((clamped - ECG_MIN) / ECG_RANGE) * height
}

function getSampleAt(
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  bufferPos: number,
): number | null {
  const cursor = totalDisplayed % DISPLAY_SAMPLES
  const offsetFromCursor = (cursor - bufferPos + DISPLAY_SAMPLES) % DISPLAY_SAMPLES
  const lag = totalReceived - totalDisplayed
  const arrIdx = samples.length - 1 - lag - offsetFromCursor
  if (arrIdx < 0 || arrIdx >= samples.length) return null
  return samples[arrIdx]
}

function drawDecimated(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  iFrom: number,
  iTo: number,
  stepPx: number,
  inGap: (i: number) => boolean,
) {
  if (iFrom > iTo) return

  const pxStart = Math.max(0, Math.floor(iFrom * stepPx))
  const pxEnd = Math.min(Math.ceil(width) - 1, Math.floor(iTo * stepPx))

  let pen = false

  for (let px = pxStart; px <= pxEnd; px++) {
    const iMin = Math.max(iFrom, Math.ceil(px / stepPx))
    const iMax = Math.min(iTo, Math.ceil((px + 1) / stepPx) - 1)
    if (iMin > iMax) continue

    let yMin = Infinity
    let yMax = -Infinity
    let lastY = 0
    let hasAny = false

    for (let i = iMin; i <= iMax; i++) {
      if (inGap(i)) continue

      const v = getSampleAt(samples, totalDisplayed, totalReceived, i)
      if (v == null) continue

      const y = sampleToY(v, height)

      if (y < yMin) yMin = y
      if (y > yMax) yMax = y

      lastY = y
      hasAny = true
    }

    if (!hasAny) {
      pen = false
      continue
    }

    const drawX = px + 0.5
    const yMinA = Math.round(yMin) + 0.5
    const yMaxA = Math.round(yMax) + 0.5
    const lastYA = Math.round(lastY) + 0.5

    if (!pen) {
      ctx.moveTo(drawX, lastYA)
      pen = true
    } else {
      ctx.lineTo(drawX, lastYA)
    }

    if (yMaxA - yMinA >= 2) {
      ctx.lineTo(drawX, yMinA)
      ctx.lineTo(drawX, yMaxA)
      ctx.lineTo(drawX, lastYA)
    }
  }
}

function makeGapChecker(cursor: number) {
  const gapStart = (cursor + 1) % DISPLAY_SAMPLES
  const gapEnd = (cursor + GAP_SAMPLES) % DISPLAY_SAMPLES

  return (i: number) =>
    gapStart <= gapEnd
      ? (i >= gapStart && i <= gapEnd)
      : (i >= gapStart || i <= gapEnd)
}

function drawFullBuffer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  cursor: number,
) {
  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = "#4ade80"
  ctx.lineWidth = 1

  const stepPx = width / DISPLAY_SAMPLES
  const inGap = makeGapChecker(cursor)

  ctx.beginPath()
  drawDecimated(
    ctx,
    width,
    height,
    samples,
    totalDisplayed,
    totalReceived,
    0,
    DISPLAY_SAMPLES - 1,
    stepPx,
    inGap
  )
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
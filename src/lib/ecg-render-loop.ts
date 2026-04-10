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
  lastCursorRef: { current: number }
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
  const { ctx, width, height, getSamples, getTargetCount, getDisplayedCount, setDisplayedCount, lastCursorRef } = state

  // Canvas가 아직 측정되지 않았으면 skip (ResizeObserver 첫 callback 전)
  if (width <= 0 || height <= 0) return

  const samples = getSamples()

  // displayedCount를 target까지 초당 250 samples 속도로 전진
  const target = getTargetCount()
  const displayed = getDisplayedCount()
  if (displayed < target) {
    setDisplayedCount(Math.min(displayed + SAMPLES_PER_SEC * deltaSec, target))
  }

  if (!samples || samples.length === 0) {
    // baseline line
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = "#1e1f35"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
    return
  }

  const totalDisplayed = Math.floor(getDisplayedCount())
  const currentCursor = totalDisplayed % DISPLAY_SAMPLES
  const lastCursor = lastCursorRef.current

  if (lastCursor < 0) {
    drawFullBuffer(ctx, width, height, samples, totalDisplayed, target, currentCursor)
  } else if (currentCursor > lastCursor) {
    drawDirtyRegion(ctx, width, height, samples, totalDisplayed, target, lastCursor, currentCursor)
  } else if (currentCursor < lastCursor) {
    // Wrap-around: 두 조각으로 분리
    drawDirtyRegion(ctx, width, height, samples, totalDisplayed, target, lastCursor, DISPLAY_SAMPLES - 1)
    drawDirtyRegion(ctx, width, height, samples, totalDisplayed, target, -1, currentCursor)
  }

  lastCursorRef.current = currentCursor
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
  const absoluteIdx = totalDisplayed - 1 - offsetFromCursor
  if (absoluteIdx < 0) return null
  const bufferStart = totalReceived - samples.length
  const arrIdx = absoluteIdx - bufferStart
  if (arrIdx < 0 || arrIdx >= samples.length) return null
  return samples[arrIdx]
}

// per-CSS-pixel min/max decimation — QRS 피크 보존 + sub-pixel AA 제거
// 픽셀 컬럼 단위로 순회하며 yMin/yMax 수집 후 수직 세그먼트로 표현.
// caller가 beginPath/stroke를 담당; 이 함수는 path 명령만 추가.
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
    // 이 CSS 픽셀 컬럼에 매핑되는 sample index 범위
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

    // half-pixel 정렬: lineWidth=1 선이 정확히 1 backing pixel에 맞음
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

    // QRS spike 등 급격한 변화: yMin~yMax 세로 span 추가 후 lastY로 복귀
    if (yMaxA - yMinA >= 2) {
      ctx.lineTo(drawX, yMinA)
      ctx.lineTo(drawX, yMaxA)
      ctx.lineTo(drawX, lastYA)
    }
  }
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
  const gapStart = (cursor + 1) % DISPLAY_SAMPLES
  const gapEnd = (cursor + GAP_SAMPLES) % DISPLAY_SAMPLES
  const inGap = (i: number) =>
    gapStart <= gapEnd ? (i >= gapStart && i <= gapEnd) : (i >= gapStart || i <= gapEnd)

  ctx.beginPath()
  drawDecimated(ctx, width, height, samples, totalDisplayed, totalReceived, 0, DISPLAY_SAMPLES - 1, stepPx, inGap)
  ctx.stroke()
}

function drawDirtyRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  samples: number[],
  totalDisplayed: number,
  totalReceived: number,
  lastCursor: number,
  currentCursor: number,
) {
  const stepPx = width / DISPLAY_SAMPLES

  // clearRect: lastCursor 픽셀부터 포함 + 정수 backing pixel 정렬 + GAP margin
  const clearStartPx = Math.max(0, Math.floor(lastCursor * stepPx) - 1)
  const clearEndPx = Math.min(
    width,
    Math.ceil((currentCursor + GAP_SAMPLES + 1) * stepPx) + 1,
  )
  if (clearEndPx > clearStartPx) {
    ctx.clearRect(clearStartPx, 0, clearEndPx - clearStartPx, height)
  }

  ctx.strokeStyle = "#4ade80"
  ctx.lineWidth = 1

  ctx.beginPath()
  // lastCursor+1부터 시작 — seam 재그리기 없이 clearRect가 이전 stroke를 완전히 덮음
  drawDecimated(ctx, width, height, samples, totalDisplayed, totalReceived, lastCursor + 1, currentCursor, stepPx, () => false)
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

"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { type EcgRenderState, registerEcgCanvas, unregisterEcgCanvas } from "@/lib/ecg-render-loop"

// ECG 수신이 이 시간 이상 끊기면 stale로 간주하고 placeholder overlay로 전환
const STALE_THRESHOLD_MS = 3000
const STALE_CHECK_INTERVAL_MS = 500
const FADE_DURATION_MS = 500

// IEC 60601-2-27 compliant Blank Gap Sweep Mode.
// 전역 공유 rAF 루프 + per-CSS-pixel min/max decimation으로 64+ beds 동시 렌더 지원.
// 데이터 없음/stale 시 dashed line + "Searching signal..." 오버레이 fade transition (asystole 패턴 회피).
export function EcgWaveform({
  samples,
  totalReceived,
}: {
  samples?: number[]
  totalReceived?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const samplesRef = useRef<number[]>([])
  const targetCountRef = useRef(0)
  const displayedCountRef = useRef(0)
  const lastUpdateAtRef = useRef(0)
  const [isStale, setIsStale] = useState(false)

  // samples prop 동기화 — refs만 업데이트 (setState 없음, cascading renders 방지).
  // isStale true↔false 전환은 아래 interval이 elapsed 기반으로 일괄 관리.
  useEffect(() => {
    if (!samples || samples.length === 0) return
    samplesRef.current = samples
    const total = totalReceived ?? samples.length
    // Cursor 재초기화 트리거:
    // (1) 초기 mount (displayed=0) — 첫 sweep 애니메이션
    // (2) lag < 0 — SSE 재연결 시 서버 카운터가 backward (세션 재시작 등)
    // (3) lag > samples.length — displayed가 rolling window 밖에 존재
    //     (장기 disconnect 동안 서버는 계속 진행, 재연결 후 displayed가 evicted 샘플 참조)
    // 재초기화 값 = rolling window의 가장 오래된 샘플 위치. displayed === target을
    // 바로 만들면 rAF catch-up이 동작 안 해 sweep이 freeze 되므로 뒤로 당김.
    const lag = total - displayedCountRef.current
    if (displayedCountRef.current === 0 || lag < 0 || lag > samples.length) {
      displayedCountRef.current = Math.max(0, total - samples.length)
    }
    targetCountRef.current = total
    lastUpdateAtRef.current = Date.now()
  }, [samples, totalReceived])

  // Stale detection + 해제 — elapsed 기반으로 isStale 값을 일괄 관리.
  // setState가 effect body가 아닌 timer callback에서 발생하므로 cascading renders 없음.
  // 최대 STALE_CHECK_INTERVAL_MS(500ms) 지연으로 true↔false 전환.
  useEffect(() => {
    const id = setInterval(() => {
      if (lastUpdateAtRef.current === 0) return
      const elapsed = Date.now() - lastUpdateAtRef.current
      const shouldBeStale = elapsed >= STALE_THRESHOLD_MS
      setIsStale((prev) => (prev === shouldBeStale ? prev : shouldBeStale))
    }, STALE_CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // 공유 rAF 루프에 등록
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: false })
    if (!ctx) return

    const state: EcgRenderState = {
      canvas,
      ctx,
      width: 0, // 0 = render loop에서 skip됨 (ResizeObserver 첫 callback 전)
      height: 0,
      getSamples: () => samplesRef.current,
      getTargetCount: () => targetCountRef.current,
      getDisplayedCount: () => displayedCountRef.current,
      setDisplayedCount: (v) => {
        displayedCountRef.current = v
      },
    }

    // DPR 적용 = backing store 재설정 + transform 재호출
    const applyDpr = (cssWidth: number, cssHeight: number) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state.width = cssWidth
      state.height = cssHeight
    }

    registerEcgCanvas(state)

    // ResizeObserver가 첫 callback에서 최종 flex layout 크기를 보고 → 그 시점에 backing store 확정
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width: w, height: h } = entry.contentRect
      if (w <= 0 || h <= 0) return
      applyDpr(w, h)
    })
    observer.observe(canvas)

    // DPR 변화 감지 (외부 모니터 이동 등) — matchMedia는 특정 DPR 값에 bound되므로 변경 시 재생성
    let mql: MediaQueryList | null = null
    const onDprChange = () => {
      if (state.width > 0 && state.height > 0) {
        applyDpr(state.width, state.height)
      }
      mql?.removeEventListener("change", onDprChange)
      mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      mql.addEventListener("change", onDprChange)
    }
    mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    mql.addEventListener("change", onDprChange)

    return () => {
      observer.disconnect()
      mql?.removeEventListener("change", onDprChange)
      unregisterEcgCanvas(state)
    }
  }, [])

  const showPlaceholder = !samples || samples.length === 0 || isStale
  const transitionStyle = { transitionDuration: `${FADE_DURATION_MS}ms` }

  return (
    <div className="relative block w-full h-[80px]">
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 block w-full h-full transition-opacity",
          showPlaceholder ? "opacity-0" : "opacity-100",
        )}
        style={transitionStyle}
      />
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity",
          showPlaceholder ? "opacity-100" : "opacity-0",
        )}
        style={transitionStyle}
      >
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#3b3b5c] -translate-y-px" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-[#0a0b1a] px-2 text-[9px] text-[#4a4a6a] tracking-wider">
            Searching signal...
          </span>
        </div>
      </div>
    </div>
  )
}

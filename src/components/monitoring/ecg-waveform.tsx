"use client"

import { useEffect, useRef } from "react"
import { type EcgRenderState, registerEcgCanvas, unregisterEcgCanvas } from "@/lib/ecg-render-loop"

// IEC 60601-2-27 compliant Blank Gap Sweep Mode.
// 전역 공유 rAF 루프 + per-CSS-pixel min/max decimation으로 64+ beds 동시 렌더 지원.
// 데이터 도착 전에는 dashed line + "Searching signal..." 오버레이 — flat line(asystole 패턴) 회피.
export function EcgWaveform({
  samples,
  totalReceived,
}: {
  samples?: number[]
  totalReceived?: number
}) {
  const isEmpty = !samples || samples.length === 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const samplesRef = useRef<number[]>([])
  const targetCountRef = useRef(0)
  const displayedCountRef = useRef(0)

  // samples prop 동기화 — total_received를 기준으로 cursor 전진
  useEffect(() => {
    if (!samples) return
    samplesRef.current = samples
    const total = totalReceived ?? samples.length
    // 초기 cursor는 현재 rolling window의 가장 오래된 샘플 위치로 설정.
    // target(=total)과 바로 같아지면 첫 데이터 이후 displayed === target이라
    // 다음 burst 까지 sweep이 freeze돼 "렌더링 후 멈춘" 것처럼 보임.
    if (displayedCountRef.current === 0) {
      displayedCountRef.current = Math.max(0, total - samples.length)
    }
    targetCountRef.current = total
  }, [samples, totalReceived])

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

  return (
    <div className="relative block w-full h-[80px]">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      {isEmpty && (
        <>
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#3b3b5c] -translate-y-px" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-[#0a0b1a] px-2 text-[9px] text-[#4a4a6a] tracking-wider">
              Searching signal...
            </span>
          </div>
        </>
      )}
    </div>
  )
}

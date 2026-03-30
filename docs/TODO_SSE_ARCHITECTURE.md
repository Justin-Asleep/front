# TODO: SSE (Server-Sent Events) Real-time Architecture

> 작성일: 2026-03-30
> 상태: 미구현 (리서치 완료)
> 우선순위: 높음 - monitoring/central-monitor 페이지 실데이터 연동 시 필수

---

## 배경

monitoring(Realtime Monitor, Realtime Station, Bed Detail)과 central-monitor 페이지는 각각 실시간 데이터 스트리밍이 필요함. 페이지마다 개별 SSE 연결 시 브라우저 제한(HTTP/1.1: 도메인당 6개)에 도달하여 API 호출이 블록될 위험이 있음.

## 핵심 제약

- **HTTP/1.1**: 브라우저당 도메인당 최대 6개 동시 연결 (Chrome/Firefox 하드 리밋, "Won't fix")
- **HTTP/2**: 단일 TCP 연결에서 100개 스트림 멀티플렉싱 가능 (제약 완화)
- **SSE는 연결을 점유**: EventSource 1개 = 1개 연결 상시 점유 → 나머지 API 호출 슬롯 감소
- **Node.js 서버**: 연결당 ~100KB 메모리, 512MB 서버에서 ~4,600 동시 연결
- **Go 서버**: 연결당 ~15KB 메모리, 같은 사양에서 ~25,000 동시 연결

## 데이터 스트림 요구사항

| 페이지 | 필요 데이터 | 빈도 |
|--------|------------|------|
| Realtime Monitor | 전체 베드 vitals (HR, SpO2, RR, Temp, BP) | 1-5초 |
| Realtime Station | 워드별 베드 vitals + 알람 상태 + 센서 퀄리티 | 1-5초 |
| Bed Detail | 개별 환자 vitals + ECG 파형 데이터 | ECG: 실시간, vitals: 1-5초 |
| Central Monitor (외부 디스플레이) | 모니터별 베드 vitals | 1-5초 |
| Alarm | 알람 발생/해제 이벤트 | 즉시 (이벤트 기반) |

---

## 채택 아키텍처: 단일 SSE + Named Events + Context Provider

### 선정 이유

- 현재 mock 데이터 단계에서 구조만 먼저 확립
- 연결 1개로 HTTP/1.1 제한 회피
- Next.js App Router의 클라이언트 네비게이션과 자연스럽게 호환 (페이지 전환 시 연결 유지)
- 나중에 WebSocket으로 전환해도 Provider만 교체 (페이지 코드 무변경)

### 아키텍처 다이어그램

```
브라우저
┌─────────────────────────────────────────────┐
│  (dashboard)/layout.tsx                      │
│  └── <SSEProvider>                           │
│       │                                      │
│       ├── Realtime Monitor  ← useVitals()    │
│       ├── Realtime Station  ← useVitals()    │
│       │                       useAlarms()    │
│       ├── Bed Detail        ← useVitals(id)  │
│       └── Central Monitor   ← useVitals()    │
│                                              │
│       1개 EventSource ←──── SSE ────→ Server │
└─────────────────────────────────────────────┘

서버
┌─────────────────────────────────────────────┐
│  GET /api/sse/stream                         │
│                                              │
│  event: vitals                               │
│  data: { beds: [...], timestamp: ... }       │
│                                              │
│  event: alarm                                │
│  data: { type: "HR_HIGH", bed: "301-1" }     │
│                                              │
│  event: device                               │
│  data: { tablet: "TAB-001", battery: 90 }    │
│                                              │
│  event: heartbeat                            │
│  data: { ts: 1234567890 }                    │
└─────────────────────────────────────────────┘
```

---

## 구현 체크리스트

### Phase 1: SSE Provider 인프라

- [ ] `src/providers/sse-provider.tsx` 생성
  - Layout 레벨에서 단일 EventSource 생성
  - React Context로 이벤트 데이터 분배
  - 연결 상태 관리 (connecting / connected / disconnected / error)
  - Page Visibility API 연동 (탭 숨김 시에도 연결 유지 - 의료 모니터링 특성)

- [ ] `src/hooks/use-sse-event.ts` 생성
  - 특정 이벤트 타입 구독 훅
  - 컴포넌트 언마운트 시 자동 구독 해제

- [ ] `src/hooks/use-vitals-stream.ts` 생성
  - vitals 이벤트 구독, 베드별 최신 데이터 반환
  - 선택적 필터링 (ward, bed ID)

- [ ] `src/hooks/use-alarm-stream.ts` 생성
  - alarm 이벤트 구독
  - 활성 알람 카운트, 알람 목록 관리

### Phase 2: 서버 측 SSE 엔드포인트

- [ ] `GET /api/sse/stream` 엔드포인트 구현
  - Named events: `vitals`, `alarm`, `device`, `heartbeat`
  - heartbeat 30초 간격 (프록시 타임아웃 방지)
  - 인증 토큰 검증 (연결 시)
  - Content-Type: text/event-stream
  - Cache-Control: no-cache
  - Connection: keep-alive

- [ ] 서버 설정
  - 리버스 프록시 buffering 비활성화 (nginx: `proxy_buffering off`)
  - 파일 디스크립터 제한 증가 (ulimit -n 65536)
  - TCP keepalive 설정

### Phase 3: 페이지 연동

- [ ] Realtime Station: mock 데이터 → useVitals() 훅으로 교체
- [ ] Realtime Monitor: mock 데이터 → useVitals() 훅으로 교체
- [ ] Bed Detail: mock 데이터 → useVitals(bedId) 훅으로 교체
- [ ] Central Monitor: mock 데이터 → useVitals() 훅으로 교체
- [ ] Alarm History Modal: mock 데이터 → useAlarms() 훅으로 교체

### Phase 4: 안정성

- [ ] Reconnection: exponential backoff (1s → 2s → 4s → 8s → max 30s)
- [ ] 연결 실패 시 폴백: REST polling (5초 간격)
- [ ] Error boundary: SSE 연결 실패해도 UI 크래시 방지
- [ ] 메모리 누수 방지: 구독 해제, EventSource close
- [ ] 연결 상태 표시: 헤더에 연결 상태 인디케이터 (초록/빨강 dot)

---

## 향후 확장 옵션

### WebSocket 전환 (대규모 시)

SSE Provider 인터페이스를 유지하면서 내부만 WebSocket으로 교체 가능:
- 양방향 통신: 클라이언트가 구독 토픽 선택 가능
- 서버 측 필터링으로 불필요한 데이터 전송 감소
- 연결당 오버헤드 감소

### Service Worker + BroadcastChannel (멀티탭 최적화)

간호사 스테이션에서 여러 탭/모니터 사용 시:
- Service Worker가 1개 SSE/WebSocket 연결 유지
- BroadcastChannel로 모든 탭에 데이터 분배
- 탭 수와 무관하게 서버 연결 1개

### ECG 파형 데이터

Bed Detail 페이지의 ECG 파형은 높은 주파수(250Hz) 데이터:
- 별도 WebSocket 채널 또는 전용 SSE 스트림 고려
- 바이너리 데이터는 WebSocket이 더 효율적 (SSE는 텍스트 전용)
- 데이터 압축/다운샘플링 필요

---

## 참고 사례

| 서비스 | 아키텍처 | 비고 |
|--------|---------|------|
| Datadog | WebSocket + HTTP/2 Server-Push + Service Worker | 대규모 모니터링 |
| Grafana | 단일 SSE + JSON 멀티플렉싱 | 대시보드 패널별 데이터를 1개 메시지로 |
| 병원 모니터링 시스템 | WebSocket + 양방향 ACK | 알람에 대한 확인(acknowledge) 응답 필요 |

@AGENTS.md

# Vital Monitoring Frontend

병원 환자 바이탈 사인 실시간 모니터링 시스템 프론트엔드.

## Tech Stack

- **Next.js 16.2** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** + **shadcn/ui 4** (@base-ui/react)
- **axios** — API client (httpOnly cookie 기반 인증)

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/              # 로그인 페이지
│   ├── (dashboard)/               # 대시보드 레이아웃 그룹
│   │   ├── admin/                 # 관리 설정 (bed-status, hospital-info, accounts, wards, alarm-settings)
│   │   ├── patients/              # 환자 관리 (list, admission, measurement)
│   │   ├── monitoring/            # 모니터링 (realtime-station, realtime-monitor, patient-monitor)
│   │   ├── central-monitor/       # 센트럴 모니터 (stations, monitors)
│   │   ├── devices/               # 디바이스 (tablets, log)
│   │   └── layout.tsx             # 대시보드 레이아웃 (header + sidebar + main)
│   ├── api/
│   │   ├── auth/                  # 인증 Route Handlers (login, refresh, logout, me)
│   │   └── proxy/[...path]/       # 백엔드 프록시 (catch-all)
│   └── layout.tsx                 # 루트 레이아웃 (AuthProvider)
├── components/
│   ├── ui/                        # shadcn/ui 프리미티브
│   ├── layout/                    # header-nav, dashboard-sidebar
│   └── {domain}/                  # 도메인별 모달 컴포넌트
├── services/
│   ├── api.ts                     # axios client + 401 refresh interceptor
│   └── cookie-config.ts           # 공유 쿠키 설정 상수 (Route Handler용)
├── providers/
│   └── auth.tsx                   # AuthProvider + useAuth hook
├── config/
│   └── navigation.ts              # 탭/사이드바 메뉴 정의
├── helpers/
│   ├── pagination.ts              # 페이지네이션 헬퍼
│   └── status-badge.ts            # Active/Inactive 배지 스타일 공유
├── data/
│   └── ward-data.ts               # Ward/Room 공유 타입 + mock 데이터
├── lib/
│   └── utils.ts                   # cn() 유틸 (shadcn 컨벤션)
├── types/auth.ts                  # 인증 관련 타입
└── proxy.ts                       # Next.js 16 Proxy (구 middleware) — 서버사이드 auth guard
```

## Architecture Decisions

### Server/Client Component 분리 (Vercel Best Practice)
- **page.tsx = Server Component** — 데이터 로딩, Client Component 렌더링
- **xxx-client.tsx = Client Component** ("use client") — 인터랙션, 상태관리, 모달
- 향후 API 연동 시 page.tsx의 mock 데이터 → `await fetch(...)` 한 줄만 변경
- 예: `page.tsx`에서 mock 데이터 로드 → `<WardsClient initialWards={wards} />` props 전달

### 디렉토리 구조 (역할별 분리)
- **`lib/`** — shadcn 전용 (`utils.ts`만 위치)
- **`services/`** — 외부 통신 (axios client, 쿠키 설정)
- **`providers/`** — React Context Provider
- **`config/`** — 앱 설정/상수 (네비게이션 메뉴)
- **`helpers/`** — 순수 유틸리티 함수
- **`data/`** — Mock 데이터, 공유 타입

### Auth: httpOnly Cookie + Route Handler Proxy
- 브라우저 → `/api/*` Route Handler → 백엔드 (`API_URL` 환경변수)
- JWT 토큰은 httpOnly 쿠키에만 저장 (XSS 방지)
- Route Handler가 쿠키에서 토큰을 꺼내 `Authorization` 헤더로 백엔드에 전달
- **`NEXT_PUBLIC_*` 환경변수로 API URL을 노출하면 안 됨** — 이 구조가 파괴됨

### Next.js 16 Proxy (구 middleware)
- `src/proxy.ts`가 서버사이드 auth guard 역할
- Next.js 16에서 `middleware.ts` → `proxy.ts`로 정식 개명 (breaking change)
- `export function proxy` (named export) 사용 — 공식 문서 기준 유효

### API Client (`src/services/api.ts`)
- `baseURL: "/api"` — same-origin Route Handler로 요청
- `auth.tsx`에서 `/auth/*` 상대경로 사용 — baseURL과 결합되어 `/api/auth/*`로 호출
- 401 응답 시 자동 refresh → retry interceptor 내장

### 환경변수
- `API_URL` (서버사이드 전용) — Route Handler에서 백엔드 주소 지정. 기본값 `http://localhost:8000`
- `.env.example` 참고

## Coding Rules

### 파일 컨벤션
- 공유 타입/데이터는 `src/data/`에 추출하여 SSOT 유지
- 쿠키 설정 등 반복되는 config는 `src/services/cookie-config.ts` 같은 공유 모듈 사용
- 도메인별 모달은 `src/components/{domain}/` 아래 배치
- shadcn/ui 컴포넌트 추가: `pnpm dlx shadcn@latest add [component]`

### Server/Client Component 규칙
- **page.tsx는 Server Component로 유지** — "use client" 금지
- 인터랙션이 필요한 UI는 같은 디렉토리에 `{name}-client.tsx`로 분리
- page.tsx에서 데이터 로드 → Client Component에 props로 전달
- 향후 API 연동 시 page.tsx를 `async function`으로 변경하고 fetch 호출

### 네비게이션
- 탭/사이드바 메뉴 순서 변경 시 `src/config/navigation.ts`만 수정
- 사이드바에서 직접 접근 불가한 상세 페이지(예: measurement, patient-monitor)는 navigation.ts에 등록하지 않음

### 스타일
- 색상값은 hex 리터럴 사용 중 (향후 CSS 변수/토큰으로 전환 예정)
- `statusBadgeClass`는 `src/helpers/status-badge.ts` 공유 유틸 사용 (Active/Inactive 패턴)
- 도메인별 고유 상태 배지(Success/Warning 등)는 해당 페이지에서 로컬 정의

### 보안
- callbackUrl은 반드시 상대 경로 검증 후 사용 (`/`로 시작, `//`로 시작하지 않음)
- JWT는 Route Handler에서 base64 decode만 수행 (서명 검증은 백엔드 담당)
- `proxy.ts`는 라우트 보호 담당, JWT 서명 검증과 무관

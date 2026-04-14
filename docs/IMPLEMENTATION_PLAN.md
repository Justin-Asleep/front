# Vital Monitoring Frontend — UI 구현 계획서

## 피그마 디자인
- **URL**: https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi
- **테마**: Medical Blue Brand (#2563EB 헤더, 화이트 사이드바, #F9FAFB 콘텐츠)
- **UX 원칙**: 혼합형 (관리자=데이터 중심, 의료진=공간 중심)
- **바이탈 색상**: HR(녹#22C55E), SpO2(하늘#38BDF8), RR(노랑#FBBF24), Temp(보라#A78BFA), BP(빨강#F87171)

## 기술 스택
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first)
- shadcn/ui (button, input, card, table, badge, tabs, select, dropdown-menu, dialog, sheet, avatar, tooltip, separator, skeleton)
- lucide-react (아이콘)

## 프로젝트 위치
`/Users/justin/Documents/source/a-vital-monitoring-frontend`

## 공통 레이아웃 (완성됨)
- `src/components/layout/header-nav.tsx` — 블루 헤더, 5개 탭
- `src/components/layout/dashboard-sidebar.tsx` — 동적 사이드바
- `src/lib/navigation.ts` — 탭/메뉴 설정
- `src/app/(dashboard)/layout.tsx` — 대시보드 레이아웃

---

## 분할 작업 (5회 세션)

### 세션 1: 관리자 설정 탭 (6페이지)
```
/ret 피그마(https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi) 기준으로 관리자 설정 탭 6개 페이지의 실제 UI 컴포넌트를 구현해줘.
프로젝트: /Users/justin/Documents/source/a-vital-monitoring-frontend
구현 계획서: docs/IMPLEMENTATION_PLAN.md 참조

대상 페이지:
1. /admin/hospital-info — 병원 정보 폼 (이름, 코드, 주소, 전화, 대표, 상태뱃지 + 저장/취소)
2. /admin/accounts — 계정 CRUD 테이블 (이름, 이메일, 역할뱃지, 상태, 생성일, Edit/Delete)
3. /admin/wards — 병동 테이블 (이름, 층, 병실수, 병상수, 점유율 바 차트, 상태)
4. /admin/rooms — 병실 테이블 (병실명, 타입 SINGLE/QUAD/HEX, 병상수, 점유/가용, 상태) + 병동 선택 드롭다운
5. /admin/alarm-settings — 바이탈별 알람 임계값 설정 (HR/SpO2/RR/Temp/BP × Low Critical/Low Warning/High Warning/High Critical)
6. /admin/bed-status — 병상 점유 대시보드 (4개 통계카드 + 병동별 카드 그리드 with 점유율 바)

공통: shadcn/ui 컴포넌트 사용, 목업 데이터 하드코딩, 테마 변수 사용
```

### 세션 2: 환자관리 탭 (3페이지) — 공간 중심 핵심
```
/ret 피그마(https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi) 기준으로 환자관리 탭 3개 페이지 UI를 구현해줘.
프로젝트: /Users/justin/Documents/source/a-vital-monitoring-frontend
구현 계획서: docs/IMPLEMENTATION_PLAN.md 참조

대상 페이지:
1. /patients/list — 환자 CRUD 테이블 (MRN, 이름, 생년월일, 성별, 병원, 상태뱃지, Edit/Del) + 검색 + 페이지네이션
2. /patients/admission — ★공간 중심★ 병상 그리드 (4열 카드)
   - 병동 선택 드롭다운 + 통계카드 3개 (Total/Occupied/Available)
   - 카드 3상태: 점유(파란 좌측보더, 환자명+입원일), 빈(점선보더, Assign Patient 버튼), 알람(빨간 좌측보더+dot)
   - "관리자는 시스템을 관리하고, 의료진은 공간(병상)을 관리한다"
3. /patients/measurement — 환자별 바이탈 측정 이력
   - 환자 정보 카드 + 시간범위 토글 [1H][6H][12H][24H][7D]
   - 5개 바이탈 트렌드 카드 (HR/SpO2/RR/Temp/BP, 각 현재값 + 미니 스파크라인)
   - 최근 측정 데이터 테이블
```

### 세션 3: 의료기기 관리 탭 (3페이지)
```
/ret 피그마(https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi) 기준으로 의료기기 관리 탭 3개 페이지 UI를 구현해줘.
프로젝트: /Users/justin/Documents/source/a-vital-monitoring-frontend
구현 계획서: docs/IMPLEMENTATION_PLAN.md 참조

대상 페이지:
1. /devices/tablets — 태블릿 CRUD 테이블 (시리얼, 병상, 병동/병실, 상태뱃지, 마지막 하트비트, Edit/Delete)
2. /devices/status — 디바이스 상태 대시보드
   - 통계카드 3개 (Online/Offline/Total)
   - 디바이스 카드 그리드 3열 (시리얼, 위치, 센서 연결 dot indicators: ECG/SpO2/Temp/BP)
   - 온라인=좌측초록보더, 오프라인=좌측회색보더+연한배경
3. /devices/log — 디바이스 로그 테이블
   - 필터: 디바이스 드롭다운 + 날짜범위 + 이벤트타입 필터
   - 테이블: 시간, 디바이스, 이벤트타입뱃지(Heartbeat:초록/Login:파랑/Error:빨강/Disconnect:주황), 상태뱃지, 상세
```

### 세션 4: 중앙모니터 설정 탭 (4페이지)
```
/ret 피그마(https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi) 기준으로 중앙모니터 설정 탭 4개 페이지 UI를 구현해줘.
프로젝트: /Users/justin/Documents/source/a-vital-monitoring-frontend
구현 계획서: docs/IMPLEMENTATION_PLAN.md 참조

대상 페이지:
1. /central-monitor/monitors — 모니터 CRUD 테이블 (이름, 병원, URL Key+복사, 할당된 병상수, 상태, Edit/Delete)
2. /central-monitor/stations — 스테이션 CRUD 테이블 (이름, 병원, 병동, URL Key+복사, 상태, Edit/Delete)
3. /central-monitor/bed-mapping — ★드래그앤드랍 UI★
   - 좌측: Available Beds 목록 (드래그 핸들 + 병상라벨 + 환자명)
   - 우측: Monitor Layout (모니터 선택 드롭다운 + 2x4 슬롯 그리드)
   - 매핑된 슬롯: solid보더 + 병상/환자 표시, 빈 슬롯: dashed보더 + "Drop bed here"
4. /central-monitor/url-keys — URL 키 관리 테이블 (타입뱃지 Monitor/Station, 이름, URL Key박스+Copy, 생성일, 상태, Regenerate 액션)
```

### 세션 5: 모니터링 탭 (4페이지) — 다크 바이탈 + 로그인
```
/ret 피그마(https://www.figma.com/design/pBi3ErYU4GagJLF4KtHlRi) 기준으로 모니터링 탭 4개 페이지 + 로그인 페이지 UI를 구현해줘.
프로젝트: /Users/justin/Documents/source/a-vital-monitoring-frontend
구현 계획서: docs/IMPLEMENTATION_PLAN.md 참조

대상 페이지:
1. /monitoring/realtime-monitor — ★4-bed 다크 대시보드★ (2x2 그리드)
   - 다크 배경 (#1A1B2E), 각 카드: 병상+환자, 5개 바이탈 수치(32px, APSF 색상), ECG 웨이브폼
2. /monitoring/realtime-station — 12-bed 미니 카드 그리드 (4x3)
   - 각 카드: 병상+환자, HR/SpO2 값, 상태 dot (정상=초록, 경고=노랑, 위험=빨강)
3. /monitoring/alarm-status — 알람 현황
   - 통계카드 3개 (Active Critical/Active Warning/Resolved Today)
   - 알람 테이블 (심각도뱃지, 병상, 환자, 파라미터, 값, 임계값, 시간, 상태)
4. /monitoring/bed-detail — 단일 환자 바이탈 상세
   - 환자 정보 카드, 5개 바이탈 카드(48px 수치 + Normal 범위), ECG 다크 패널(전체폭)
5. /login — 좌측 블루 브랜딩 + 우측 로그인 폼 (이메일/비밀번호/Sign In)

핵심: 모니터링 페이지는 -m-6 p-6 bg-gray-950으로 다크 풀블리드 처리
```

---

## 각 세션 공통 지침
- shadcn/ui 컴포넌트 최대 활용 (Button, Card, Table, Badge, Input, Select, Dialog 등)
- 테마 변수 사용 (`bg-primary`, `text-muted-foreground` 등)
- 목업 데이터는 하드코딩 (나중에 API 연동)
- 바이탈 색상: Tailwind 커스텀 클래스 또는 인라인 스타일
- TypeScript strict, ESLint 통과 필수
- 컴포넌트 분리: 페이지당 1~3개 재사용 컴포넌트 추출

## 바이탈 색상 참조 (APSF 표준)
| 파라미터 | HEX | Tailwind class |
|---------|-----|---------------|
| HR | #22C55E | text-green-500 |
| SpO2 | #38BDF8 | text-sky-400 |
| RR | #FBBF24 | text-yellow-400 |
| Temp | #A78BFA | text-purple-400 |
| BP | #F87171 | text-red-400 |
| ECG | #4ADE80 | text-green-400 |

## 알람 색상
| 심각도 | HEX | 용도 |
|--------|-----|------|
| Critical | #EF4444 | 즉각 대응 |
| Warning | #F97316 | 주의 필요 |
| Info | #3B82F6 | 참고 정보 |

## 병상 카드 상태
| 상태 | 좌측보더 | 배경 |
|------|---------|------|
| 정상(점유) | blue-500 | blue-50 |
| 알람 | red-500 | red-50 |
| 빈 병상 | gray-300 | gray-50 (dashed) |

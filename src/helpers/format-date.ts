// 백엔드가 보내는 ISO datetime을 브라우저 로컬 timezone 기준으로 포맷.
// 주의: JS Date 파싱 규칙상 date-time 문자열에 timezone offset이 없으면 local time으로
// 해석되므로, Z 혹은 +HH:MM 같은 offset designator가 없으면 UTC로 간주해 Z를 붙인다.

const pad = (n: number) => String(n).padStart(2, "0")

export function parseIsoAsUtc(iso: string): Date {
  if (iso.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(iso)) return new Date(iso)
  return new Date(iso + "Z")
}

export function toLocalDate(iso: string): string {
  const d = parseIsoAsUtc(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toLocalDateTime(iso: string): string {
  const d = parseIsoAsUtc(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// "HH:MM" (로컬)
export function toLocalHourMinute(iso: string): string {
  const d = parseIsoAsUtc(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// measurement-client 등에서 시간대별 그룹핑 정렬키로 쓰는 로컬 "YYYY-MM-DDTHH:MM" 포맷.
export function toLocalGroupKey(iso: string): string {
  const d = parseIsoAsUtc(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

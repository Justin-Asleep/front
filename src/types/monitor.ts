// ── Monitor Realtime Types ────────────────────────────────────────────────────

export interface VitalRange {
  high: number | null
  low: number | null
}

export interface RealtimeBedVitals {
  hr: number | null
  hr_range: VitalRange | null
  spo2: number | null
  spo2_range: VitalRange | null
  rr: number | null
  rr_range: VitalRange | null
  temp: number | null
  temp_range: VitalRange | null
  bp_systolic: number | null
  bp_diastolic: number | null
  bp_mean: number | null
  pvc: number | null
  ews: number | null
}

export interface SensorStatus {
  connected: boolean
  battery_level: number | null
  signal_quality: number | null
}

export interface TabletStatus {
  serial_number: string
  is_active: boolean
  is_online: boolean
  last_event: string | null
  last_status: string | null
  battery: number | null
  ecg: SensorStatus | null
  spo2: SensorStatus | null
  temp: SensorStatus | null
}

export interface RealtimeBed {
  position: number
  bed_id: string | null
  bed_label: string | null
  ward_name: string | null
  room_name: string | null
  patient_name: string | null
  patient_gender: string | null
  patient_age: number | null
  encounter_id: string | null
  vitals: RealtimeBedVitals | null
  tablet: TabletStatus | null
}

export interface MonitorRealtime {
  monitor_id: string
  monitor_name: string
  layout: string
  beds: RealtimeBed[]
}

export interface MonitorListItem {
  id: string
  name: string
  layout: string
  is_active: boolean
}

export interface PaginatedData<T> {
  items: T[]
  total: number
}

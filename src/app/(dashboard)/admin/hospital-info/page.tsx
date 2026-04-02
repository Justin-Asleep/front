// Server Component
import { type HospitalData, HospitalInfoClient } from "./hospital-info-client"

const mockHospitalData: HospitalData = {
  name: "Seoul National Univ. Hospital",
  code: "SNU",
  address: "101 Daehak-ro, Jongno-gu, Seoul",
  phone: "02-2072-2114",
  representative: "Dr. Kim",
  status: "Active",
}

export default function HospitalInfoPage() {
  // 향후: const data = await fetchHospitalInfo()
  const data = mockHospitalData
  return <HospitalInfoClient initialData={data} />
}

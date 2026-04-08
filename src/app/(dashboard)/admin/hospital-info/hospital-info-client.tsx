"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiGet } from "@/services/api"

interface RepresentativeDTO {
  name: string
  email: string
  role: string
}

interface HospitalDTO {
  id: string
  hospital_name: string
  classification_code: string | null
  address: string | null
  telephone_number: string | null
}

interface HospitalInfoDTO {
  hospital: HospitalDTO
  representative: RepresentativeDTO | null
}

export function HospitalInfoClient() {
  const [data, setData] = useState<HospitalInfoDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiGet<HospitalInfoDTO>("/proxy/hospitals/me")
      setData(result)
    } catch (err) {
      console.error("Failed to load hospital info:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#9ca3af]">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#dc2626]">Failed to load hospital information</p>
      </div>
    )
  }

  const { hospital, representative } = data

  const fields = [
    { label: "Hospital Name", value: hospital.hospital_name },
    { label: "Hospital Code", value: hospital.classification_code ?? "-" },
    { label: "Address", value: hospital.address ?? "-" },
    { label: "Phone", value: hospital.telephone_number ?? "-" },
    { label: "Representative", value: representative ? `${representative.name} (${representative.email})` : "-" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hospital Information</h1>
        <p className="text-muted-foreground">Hospital basic information</p>
      </div>
      <Card className="max-w-[800px]">
        <CardHeader className="border-b">
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex items-center">
              <label className="w-[168px] shrink-0 text-sm font-medium text-[#4b5563]">
                {label}
              </label>
              <span className="text-sm text-[#111827]">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

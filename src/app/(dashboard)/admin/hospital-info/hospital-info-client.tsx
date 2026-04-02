"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export interface HospitalData {
  name: string
  code: string
  address: string
  phone: string
  representative: string
  status: string
}

const fields = [
  { label: "Hospital Name", key: "name" },
  { label: "Hospital Code", key: "code" },
  { label: "Address", key: "address" },
  { label: "Phone", key: "phone" },
  { label: "Representative", key: "representative" },
] as const

export function HospitalInfoClient({ initialData }: { initialData: HospitalData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hospital Information</h1>
        <p className="text-muted-foreground">Manage hospital basic information and settings</p>
      </div>
      <Card className="max-w-[800px]">
        <CardHeader className="border-b">
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {fields.map(({ label, key }) => (
            <div key={key} className="flex items-center">
              <label className="w-[168px] shrink-0 text-sm font-medium text-[#4b5563]">
                {label}
              </label>
              <Input
                defaultValue={initialData[key]}
                className="w-[560px]"
              />
            </div>
          ))}
          <div className="flex items-center">
            <label className="w-[168px] shrink-0 text-sm font-medium text-[#4b5563]">
              Status
            </label>
            <span className="bg-[#dcfce7] text-[#16a34a] px-3 py-1 rounded-full text-xs font-medium">
              {initialData.status}
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

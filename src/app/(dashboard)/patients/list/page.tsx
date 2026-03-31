"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { AddPatientModal } from "@/components/patients/add-patient-modal"
import { EditPatientModal } from "@/components/patients/edit-patient-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

type PatientStatus = "Active" | "Admitted" | "Discharged"

type Patient = {
  mrn: string
  name: string
  dob: string
  gender: "Male" | "Female"
  hospital: string
  status: PatientStatus
}

const mockPatients: Patient[] = [
  { mrn: "P-001234", name: "Kim Minjun",   dob: "1990-05-12", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001235", name: "Park Soyeon",  dob: "1985-11-23", gender: "Female", hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001236", name: "Lee Jungho",   dob: "1978-03-07", gender: "Male",   hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001237", name: "Choi Yuna",    dob: "1995-08-19", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001238", name: "Jung Hyunwoo", dob: "1962-01-30", gender: "Male",   hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001239", name: "Han Minji",    dob: "1988-07-14", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001240", name: "Kang Seojun",  dob: "1973-12-05", gender: "Male",   hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001241", name: "Yoon Jiyeon",  dob: "2001-04-22", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001242", name: "Oh Junhyuk",   dob: "1988-04-11", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001243", name: "Lim Chaeyeon", dob: "1993-08-29", gender: "Female", hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001244", name: "Shin Donghyun",dob: "1971-02-17", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001245", name: "Bae Jiyeon",   dob: "1996-10-05", gender: "Female", hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001246", name: "Kwon Minho",   dob: "1984-06-23", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001247", name: "Jeon Somin",   dob: "1999-12-01", gender: "Female", hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001248", name: "Moon Jaehwan", dob: "1967-09-18", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001249", name: "Ryu Hyejin",   dob: "1992-03-07", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001250", name: "Nam Junseo",   dob: "1980-07-14", gender: "Male",   hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001251", name: "Yoo Eunjung",  dob: "1987-11-25", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001252", name: "Ko Sanghyun",  dob: "1976-05-09", gender: "Male",   hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001253", name: "Im Soyul",     dob: "1994-01-16", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001254", name: "Woo Taehyun",  dob: "1983-08-03", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001255", name: "Cha Mirae",    dob: "1997-04-20", gender: "Female", hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001256", name: "Song Jinhyuk", dob: "1969-10-31", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001257", name: "Hwang Nayeon", dob: "1990-06-12", gender: "Female", hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001258", name: "Ahn Byunghun", dob: "1978-02-28", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001259", name: "Ji Hyeonsuk",  dob: "1995-09-06", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001260", name: "Seo Minseok",  dob: "1985-12-22", gender: "Male",   hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001261", name: "Noh Jiyun",    dob: "1973-07-08", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001262", name: "Gang Dohyun",  dob: "1991-03-19", gender: "Male",   hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001263", name: "Jang Seulgi",  dob: "1988-11-04", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001264", name: "Heo Junseo",   dob: "1982-05-27", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001265", name: "Yang Minji",   dob: "1996-08-15", gender: "Female", hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001266", name: "Cheon Minjae", dob: "1975-01-30", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001267", name: "Do Hayeon",    dob: "1993-06-17", gender: "Female", hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001268", name: "Gong Suhyun",  dob: "1986-10-09", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001269", name: "Bang Jisoo",   dob: "1998-04-02", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001270", name: "Min Kyungjun", dob: "1979-09-24", gender: "Male",   hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001271", name: "Tak Jihyun",   dob: "1992-02-11", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001272", name: "Joo Jaewon",   dob: "1984-07-06", gender: "Male",   hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001273", name: "Lim Dawon",    dob: "1971-12-19", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001274", name: "Baek Seungho", dob: "1989-05-14", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001275", name: "Ha Eunbi",     dob: "1994-08-28", gender: "Female", hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001276", name: "Goo Jaehoon",  dob: "1977-03-05", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001277", name: "Shin Yunji",   dob: "1997-11-21", gender: "Female", hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001278", name: "Koo Sangjun",  dob: "1981-06-07", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001279", name: "Yim Haeun",    dob: "1990-01-18", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001280", name: "No Kihoon",    dob: "1968-09-30", gender: "Male",   hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001281", name: "Jung Eunha",   dob: "1995-04-14", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001282", name: "Park Junho",   dob: "1983-07-26", gender: "Male",   hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001283", name: "Lee Seoyeon",  dob: "1987-02-03", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001284", name: "Kim Taehoon",  dob: "1976-10-22", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001285", name: "Choi Jiyoon",  dob: "1993-05-08", gender: "Female", hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001286", name: "Han Seungjun", dob: "1985-12-15", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001287", name: "Yoon Mikyung", dob: "1970-08-01", gender: "Female", hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001288", name: "Oh Dongwook",  dob: "1988-03-17", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001289", name: "Seo Jiyeon",   dob: "1996-06-29", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001290", name: "Kang Minwoo",  dob: "1980-11-12", gender: "Male",   hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001291", name: "Im Hyeji",     dob: "1992-04-25", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001292", name: "Jeon Sungmin", dob: "1974-09-09", gender: "Male",   hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001293", name: "Na Jieun",     dob: "1999-01-27", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001294", name: "Woo Hyunsu",   dob: "1986-07-04", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001295", name: "Cha Sujin",    dob: "1991-12-20", gender: "Female", hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001296", name: "Ryu Jaemin",   dob: "1978-05-16", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001297", name: "Song Hyewon",  dob: "1994-02-08", gender: "Female", hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001298", name: "Moon Seungho", dob: "1982-08-23", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001299", name: "Ji Sohyun",    dob: "1997-03-11", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001300", name: "Kwon Taejun",  dob: "1973-10-07", gender: "Male",   hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001301", name: "Ahn Sooyeon",  dob: "1989-06-19", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001302", name: "Ko Minsub",    dob: "1984-01-03", gender: "Male",   hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001303", name: "Yang Hyejin",  dob: "1976-09-15", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001304", name: "Gong Jaehyuk", dob: "1993-04-28", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001305", name: "Jang Yeeun",   dob: "1998-07-21", gender: "Female", hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001306", name: "Bang Sungwoo", dob: "1981-12-06", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001307", name: "Ha Jiwon",     dob: "1990-05-22", gender: "Female", hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001308", name: "Min Dokyun",   dob: "1977-02-14", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001309", name: "Tak Minji",    dob: "1995-08-30", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001310", name: "Joo Seungwon", dob: "1987-11-18", gender: "Male",   hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001311", name: "Baek Jiyun",   dob: "1972-06-05", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001312", name: "Gang Hyunwoo", dob: "1985-01-24", gender: "Male",   hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001313", name: "Do Sunyoung",  dob: "1991-09-10", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001314", name: "Heo Minsoo",   dob: "1983-04-16", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001315", name: "Ji Yeonhee",   dob: "1996-07-03", gender: "Female", hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001316", name: "Shin Kyungho", dob: "1979-02-19", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001317", name: "Yim Sojeong",  dob: "1994-10-27", gender: "Female", hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001318", name: "No Jaesung",   dob: "1968-05-13", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001319", name: "Goo Hyeran",   dob: "1992-12-08", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001320", name: "Koo Sunghun",  dob: "1975-08-26", gender: "Male",   hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001321", name: "Seo Dahye",    dob: "1989-03-14", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001322", name: "Park Jinhyuk", dob: "1986-06-01", gender: "Male",   hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001323", name: "Lee Soyoung",  dob: "1997-09-17", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001324", name: "Kim Junseok",  dob: "1982-01-29", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001325", name: "Choi Boyeon",  dob: "1993-07-15", gender: "Female", hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001326", name: "Jung Sunwoo",  dob: "1974-04-03", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001327", name: "Han Eunjin",   dob: "1998-11-20", gender: "Female", hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001328", name: "Yoon Jaehyun", dob: "1981-05-08", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001329", name: "Oh Seoyeon",   dob: "1990-10-24", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001330", name: "Kang Hyunseok",dob: "1977-03-12", gender: "Male",   hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001331", name: "Im Dawon",     dob: "1995-08-06", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001332", name: "Jeon Youngjun",dob: "1984-12-23", gender: "Male",   hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001333", name: "Na Hyerim",    dob: "1969-07-09", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001334", name: "Woo Minseok",  dob: "1987-02-25", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001335", name: "Cha Yeonsoo",  dob: "1992-09-11", gender: "Female", hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001336", name: "Ryu Seungjae", dob: "1980-04-27", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001337", name: "Song Jieun",   dob: "1996-01-14", gender: "Female", hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001338", name: "Moon Kyungil", dob: "1983-06-30", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001339", name: "Ji Nayeon",    dob: "1991-11-16", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001340", name: "Kwon Jungsoo", dob: "1976-08-04", gender: "Male",   hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001341", name: "Ahn Hyejung",  dob: "1994-03-21", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001342", name: "Ko Jinhwan",   dob: "1985-10-07", gender: "Male",   hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001343", name: "Yang Soomin",  dob: "1970-05-23", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001344", name: "Gong Taeyeon", dob: "1989-01-10", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001345", name: "Jang Hyunah",  dob: "1997-06-26", gender: "Female", hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001346", name: "Bang Minjun",  dob: "1978-11-11", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001347", name: "Ha Seoyeon",   dob: "1993-04-18", gender: "Female", hospital: "Seoul General",  status: "Admitted" },
  { mrn: "P-001348", name: "Min Sungjin",  dob: "1986-09-04", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001349", name: "Tak Jiyoung",  dob: "1999-02-20", gender: "Female", hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001350", name: "Joo Hyunwook", dob: "1974-07-07", gender: "Male",   hospital: "Seoul General",  status: "Discharged" },
  { mrn: "P-001351", name: "Baek Eunji",   dob: "1988-12-24", gender: "Female", hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001352", name: "Gang Jongwoo", dob: "1981-05-19", gender: "Male",   hospital: "Asan Medical",   status: "Admitted" },
  { mrn: "P-001353", name: "Do Yoonsoo",   dob: "1995-10-05", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001354", name: "Heo Jaeuk",    dob: "1984-03-22", gender: "Male",   hospital: "Yonsei Medical", status: "Active" },
  { mrn: "P-001355", name: "Ji Mirae",     dob: "1992-08-08", gender: "Female", hospital: "Asan Medical",   status: "Discharged" },
  { mrn: "P-001356", name: "Shin Byungjun",dob: "1975-01-25", gender: "Male",   hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001357", name: "Yim Hyeonsuk", dob: "1990-06-11", gender: "Female", hospital: "Yonsei Medical", status: "Admitted" },
  { mrn: "P-001358", name: "No Sanghyuck", dob: "1983-11-27", gender: "Male",   hospital: "Asan Medical",   status: "Active" },
  { mrn: "P-001359", name: "Goo Jiyeon",   dob: "1997-04-13", gender: "Female", hospital: "Seoul General",  status: "Active" },
  { mrn: "P-001360", name: "Koo Minkyung", dob: "1979-09-29", gender: "Male",   hospital: "Yonsei Medical", status: "Discharged" },
  { mrn: "P-001361", name: "Seo Hyewon",   dob: "1994-02-15", gender: "Female", hospital: "Asan Medical",   status: "Active" },
]

const PAGE_SIZE = 8

const statusBadgeClass: Record<PatientStatus, string> = {
  Active:     "bg-[#dcfce7] text-[#16a34a] border-0",
  Admitted:   "bg-[#eff6ff] text-[#2563eb] border-0",
  Discharged: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

export default function PatientListPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Patient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  const filtered = useMemo(() => {
    return mockPatients.filter((p) =>
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Patient List</h1>
          <p className="text-sm text-[#4b5563]">Manage patient records across all hospitals</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Patient
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-4 text-[#9ca3af] pointer-events-none" />
          <Input
            placeholder="Search patients..."
            className="pl-8 w-[300px] h-9 border-[#d1d5db]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">MRN</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">DOB</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Gender</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Hospital</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-[#9ca3af]">
                    No patients found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((patient, idx) => (
                  <TableRow
                    key={patient.mrn}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3">
                      <span
                        className="text-[#2563eb] font-medium cursor-pointer hover:underline"
                        onClick={() => router.push(`/patients/measurement?mrn=${patient.mrn}`)}
                      >
                        {patient.mrn}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-[#111827]">{patient.name}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{patient.dob}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{patient.gender}</TableCell>
                    <TableCell className="px-4 py-3 text-[#4b5563]">{patient.hospital}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[patient.status]}>{patient.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => setEditTarget(patient)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(patient)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="patients"
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddPatientModal
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <EditPatientModal
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        patient={editTarget}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Patient"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={() => setDeleteTarget(null)}
      />
    </div>
  )
}

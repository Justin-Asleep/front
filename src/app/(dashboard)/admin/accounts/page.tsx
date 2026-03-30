"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { AddMemberModal } from "@/components/admin/add-member-modal"
import { EditMemberModal } from "@/components/admin/edit-member-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

type Role = "Admin" | "Nurse" | "Doctor"
type Status = "Active" | "Inactive"

type Account = {
  id: string
  name: string
  email: string
  role: Role
  status: Status
  createdAt: string
}

const mockAccounts: Account[] = [
  { id: "1",  name: "Dr. Kim Minjun",  email: "kim.mj@hospital.com",   role: "Admin",  status: "Active",   createdAt: "2026-01-15" },
  { id: "2",  name: "Park Soyeon",     email: "park.sy@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-02-01" },
  { id: "3",  name: "Lee Jihoon",      email: "lee.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-02-10" },
  { id: "4",  name: "Choi Yuna",       email: "choi.yn@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-02-20" },
  { id: "5",  name: "Jung Doyoon",     email: "jung.dy@hospital.com",  role: "Doctor", status: "Inactive", createdAt: "2026-03-01" },
  { id: "6",  name: "Kang Haein",      email: "kang.he@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-03-05" },
  { id: "7",  name: "Yoon Seojin",     email: "yoon.sj@hospital.com",  role: "Admin",  status: "Active",   createdAt: "2026-03-10" },
  { id: "8",  name: "Hwang Jiwoo",     email: "hwang.jw@hospital.com", role: "Doctor", status: "Active",   createdAt: "2026-03-15" },
  { id: "9",  name: "Son Minji",       email: "son.mj@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-16" },
  { id: "10", name: "Lim Chanwoo",     email: "lim.cw@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-17" },
  { id: "11", name: "Oh Jiyeon",       email: "oh.jy@hospital.com",    role: "Admin",  status: "Inactive", createdAt: "2026-03-18" },
  { id: "12", name: "Bae Sunghoon",    email: "bae.sh@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-19" },
  { id: "13", name: "Shin Hyunwoo",    email: "shin.hw@hospital.com",  role: "Doctor", status: "Active",   createdAt: "2026-03-20" },
  { id: "14", name: "Han Jisoo",       email: "han.js@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-21" },
  { id: "15", name: "Ko Eunji",        email: "ko.ej@hospital.com",    role: "Doctor", status: "Active",   createdAt: "2026-03-22" },
  { id: "16", name: "Jeon Hyebin",     email: "jeon.hb@hospital.com",  role: "Admin",  status: "Active",   createdAt: "2026-03-23" },
  { id: "17", name: "Moon Sehun",      email: "moon.sh@hospital.com",  role: "Nurse",  status: "Inactive", createdAt: "2026-03-24" },
  { id: "18", name: "Ryu Jeonghoon",   email: "ryu.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-25" },
  { id: "19", name: "Nam Dawon",       email: "nam.dw@hospital.com",   role: "Nurse",  status: "Active",   createdAt: "2026-03-25" },
  { id: "20", name: "Yoo Jaehyun",     email: "yoo.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-26" },
  { id: "21", name: "Kwon Nara",       email: "kwon.nr@hospital.com",  role: "Nurse",  status: "Active",   createdAt: "2026-03-26" },
  { id: "22", name: "Cha Eunwoo",      email: "cha.ew@hospital.com",   role: "Admin",  status: "Active",   createdAt: "2026-03-26" },
  { id: "23", name: "Woo Joohyun",     email: "woo.jh@hospital.com",   role: "Doctor", status: "Active",   createdAt: "2026-03-27" },
  { id: "24", name: "Im Nayeon",       email: "im.ny@hospital.com",    role: "Nurse",  status: "Active",   createdAt: "2026-03-27" },
]

const ROLE_FILTERS = ["All", "Admin", "Nurse", "Doctor"] as const
const PAGE_SIZE = 8

const roleBadgeClass: Record<Role, string> = {
  Admin:  "bg-[#eff6ff] text-[#2563eb] border-0",
  Nurse:  "bg-[#dcfce7] text-[#16a34a] border-0",
  Doctor: "bg-[#ede9fe] text-[#a78bfb] border-0",
}

const statusBadgeClass: Record<Status, string> = {
  Active:   "bg-[#dcfce7] text-[#16a34a] border-0",
  Inactive: "bg-[#f3f4f6] text-[#9ca3af] border-0",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [search, setSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchesSearch =
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = selectedRole === "All" || a.role === selectedRole
      return matchesSearch && matchesRole
    })
  }, [accounts, search, selectedRole])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  function handleRoleChange(role: string) {
    setSelectedRole(role)
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleAdd(data: { name: string; email: string; role: Role; status: Status }) {
    const newAccount: Account = {
      id: String(Date.now()),
      ...data,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setAccounts((prev) => [newAccount, ...prev])
  }

  function handleSave(data: Account) {
    setAccounts((prev) => prev.map((a) => (a.id === data.id ? data : a)))
  }

  function handleDelete() {
    if (!deleteTarget) return
    setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Account Management</h1>
          <p className="text-sm text-[#4b5563]">Manage hospital staff accounts and permissions</p>
        </div>
        <Button
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          onClick={() => setAddOpen(true)}
        >
          + Add Member
        </Button>
      </div>

      <Card className="border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb]">
            <Input
              placeholder="Search by name or email..."
              className="w-[300px] h-[38px] border-[#d1d5db]"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <div className="flex gap-2">
              {ROLE_FILTERS.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={cn(
                    "px-3 h-[32px] rounded-full text-[13px] font-medium transition-colors",
                    selectedRole === role
                      ? "bg-[#2563eb] text-white"
                      : "bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-[#f9fafb]"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Name</TableHead>
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Email</TableHead>
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Role</TableHead>
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Status</TableHead>
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Created</TableHead>
                <TableHead className="px-4 py-3 text-[12px] font-semibold text-[#9ca3af]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-[#9ca3af]">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((account, idx) => (
                  <TableRow
                    key={account.id}
                    className={cn(
                      "border-b border-[#e5e7eb]",
                      idx % 2 === 1 ? "bg-[#f9fafb]" : "bg-white"
                    )}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs bg-[#eff6ff] text-[#2563eb]">
                            {getInitials(account.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[#111827]">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[13px] text-[#4b5563]">{account.email}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={roleBadgeClass[account.role]}>{account.role}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[account.status]}>{account.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[13px] text-[#4b5563]">{account.createdAt}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-[13px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => setEditTarget(account)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-[13px] font-medium text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(account)}
                        >
                          Delete
                        </button>
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
            label="members"
          />
        </CardContent>
      </Card>

      <AddMemberModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />

      <EditMemberModal
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        member={editTarget}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Member"
        targetName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}

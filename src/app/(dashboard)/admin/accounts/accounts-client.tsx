"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
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
import { Search, Pencil, Trash2 } from "lucide-react"
import { PaginationBar } from "@/components/ui/pagination-bar"
import { AddMemberModal } from "@/components/admin/add-member-modal"
import { EditMemberModal } from "@/components/admin/edit-member-modal"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { statusBadgeClass } from "@/helpers/status-badge"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api"

// ── Types ────────────────────────────────────────────────────────────────────

interface MemberResponse {
  id: string
  hospital_id: string
  email: string
  name: string
  first_name: string
  last_name: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type Status = "Active" | "Inactive"

export type Account = {
  id: string
  name: string
  firstName: string
  lastName?: string
  email: string
  role: string
  status: Status
  createdAt: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

function toAccount(m: MemberResponse): Account {
  return {
    id: m.id,
    name: m.name,
    firstName: m.first_name,
    lastName: m.last_name ?? undefined,
    email: m.email,
    role: capitalize(m.role),
    status: m.is_active ? "Active" : "Inactive",
    createdAt: m.created_at.slice(0, 10),
  }
}

const PAGE_SIZE = 8

const roleBadgeClass: Record<string, string> = {
  Admin:  "bg-[#eff6ff] text-[#2563eb] border-0",
  Nurse:  "bg-[#dcfce7] text-[#16a34a] border-0",
  Doctor: "bg-[#ede9fe] text-[#a78bfb] border-0",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// ── Component ────────────────────────────────────────────────────────────────

export function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      const [membersRes, rolesRes] = await Promise.all([
        apiGet<{ items: MemberResponse[]; total: number }>(
          `/proxy/members?page=1&size=100`
        ),
        apiGet<string[]>("/proxy/members/roles"),
      ])
      setAccounts(membersRes.items.map(toAccount))
      setRoles(rolesRes)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // ── Filters ──────────────────────────────────────────────────────────────

  const roleFilters = useMemo(
    () => ["All", ...roles.map((r) => capitalize(r))],
    [roles]
  )

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

  // ── CRUD handlers ────────────────────────────────────────────────────────

  async function handleAdd(data: { firstName: string; lastName?: string; email: string; role: string; password: string }) {
    try {
      await apiPost("/proxy/members", {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName ?? null,
        role: data.role.toUpperCase(),
        password: data.password,
      })
      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member")
    }
  }

  async function handleSave(data: Account) {
    try {
      await apiPatch(`/proxy/members/${data.id}`, {
        first_name: data.firstName,
        last_name: data.lastName ?? null,
        role: data.role.toUpperCase(),
        is_active: data.status === "Active",
      })
      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiDelete(`/proxy/members/${deleteTarget.id}`)
      setDeleteTarget(null)
      await fetchMembers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member")
    }
  }

  // ── Loading / Error states ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#9ca3af]">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

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

      {/* Search + Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-4 text-[#9ca3af] pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            className="pl-8 w-[300px] h-9 border-[#d1d5db]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {roleFilters.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
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

      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
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
                      <Badge className={roleBadgeClass[account.role] ?? ""}>{account.role}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusBadgeClass[account.status]}>{account.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-[13px] text-[#4b5563]">{account.createdAt}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#2563eb] hover:text-[#1d4ed8]"
                          onClick={() => setEditTarget(account)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#dc2626] hover:text-[#b91c1c]"
                          onClick={() => setDeleteTarget(account)}
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
            label="members"
          />
        </CardContent>
      </Card>

      <AddMemberModal
        open={addOpen}
        onOpenChange={setAddOpen}
        roles={roles}
        onAdd={handleAdd}
      />

      <EditMemberModal
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        member={editTarget}
        roles={roles}
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

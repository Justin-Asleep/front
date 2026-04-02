"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type Status = "Active" | "Inactive"

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

interface MemberData {
  id: string
  name: string
  firstName: string
  lastName?: string
  email: string
  role: string
  status: Status
  createdAt: string
}

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: MemberData | null
  roles: string[]
  onSave: (data: MemberData) => void
}

export function EditMemberModal({ open, onOpenChange, member, roles, onSave }: EditMemberModalProps) {
  const [firstName, setFirstName] = useState(member?.firstName ?? "")
  const [lastName, setLastName] = useState(member?.lastName ?? "")
  const email = member?.email ?? ""
  const [role, setRole] = useState(member?.role ?? "")
  const [active, setActive] = useState(member?.status !== "Inactive")

  useEffect(() => {
    if (member) {
      setFirstName(member.firstName)
      setLastName(member.lastName ?? "")
      setRole(member.role)
      setActive(member.status !== "Inactive")
    }
  }, [member])

  function handleSubmit() {
    if (!member || !firstName) return
    onSave({
      ...member,
      firstName,
      lastName: lastName || undefined,
      name: lastName ? `${firstName} ${lastName}` : firstName,
      role,
      status: active ? "Active" : "Inactive",
    })
    onOpenChange(false)
  }

  function handleCancel() {
    onOpenChange(false)
  }

  return (
    <Dialog key={member?.id} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Edit Member
              </DialogTitle>
              <p className="text-[14px] text-[#9ca3af] mt-1">Update staff account information</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] text-[16px] leading-none hover:text-[#6b7280] mt-0.5"
            >
              x
            </button>
          </div>
        </DialogHeader>

        <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

        {/* Form */}
        <div className="px-8 py-4 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">First Name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] font-medium text-[#111827]">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Email</label>
            <Input
              type="email"
              value={email}
              readOnly
              className="h-10 border-[#d1d5db] rounded-lg text-[14px] bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#111827]">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
              <SelectTrigger className="w-full h-10 border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={capitalize(r)}>
                    {capitalize(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#111827]">Status</label>
            <div className="flex items-center gap-3">
              <Switch
                checked={active}
                onCheckedChange={(checked) => setActive(checked)}
                aria-label="Status toggle"
                className="data-checked:bg-[#16a34a]"
              />
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium",
                  active
                    ? "bg-[#dcfce7] text-[#16a34a]"
                    : "bg-[#f3f4f6] text-[#9ca3af]"
                )}
              >
                {active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#e5e7eb] mx-8" />

        {/* Footer */}
        <div className="px-8 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 w-[100px] border-[#d1d5db] text-[#4b5563] text-[14px] font-medium rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!firstName}
            className="h-10 w-[140px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

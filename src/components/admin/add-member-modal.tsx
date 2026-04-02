"use client"

import { useState } from "react"
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

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: string[]
  onAdd: (data: { firstName: string; lastName?: string; email: string; role: string; password: string }) => Promise<void>
}

export function AddMemberModal({ open, onOpenChange, roles, onAdd }: AddMemberModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!firstName || !email || !role || !password) return
    setSubmitting(true)
    try {
      await onAdd({ firstName, lastName: lastName || undefined, email, role, password })
      onOpenChange(false)
      setFirstName("")
      setLastName("")
      setEmail("")
      setRole("")
      setPassword("")
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    onOpenChange(false)
    setFirstName("")
    setLastName("")
    setEmail("")
    setRole("")
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[520px] max-w-[520px] rounded-2xl p-0 gap-0 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.15)]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-8 pt-7 pb-0 gap-1">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-[20px] font-bold text-[#111827]">
                Add New Member
              </DialogTitle>
              <p className="text-[14px] text-[#4b5563] mt-1">Create a new staff account</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-[#9ca3af] text-[18px] leading-none hover:text-[#6b7280] mt-0.5"
            >
              ✕
            </button>
          </div>
        </DialogHeader>

        <div className="h-px bg-[#e5e7eb] mx-8 mt-5" />

        {/* Form */}
        <div className="px-8 py-4 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[14px] font-medium text-[#4b5563]">First Name</label>
              <Input
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[14px] font-medium text-[#4b5563]">Last Name</label>
              <Input
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[#4b5563]">Email</label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[#4b5563]">Password</label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 border-[#d1d5db] rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[14px] font-medium text-[#4b5563]">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
              <SelectTrigger className="w-full h-10 border-[#d1d5db] rounded-lg text-[14px]">
                <SelectValue placeholder="Select role..." />
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
            disabled={!firstName || !email || !role || !password || submitting}
            className="h-10 w-[160px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold rounded-lg"
          >
            {submitting ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

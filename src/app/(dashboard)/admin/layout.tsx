"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth"

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"])

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || !ADMIN_ROLES.has(user.role))) {
      router.replace("/patients/list")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !ADMIN_ROLES.has(user.role)) {
    return null
  }

  return <>{children}</>
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveTabId, getVisibleTabs } from "@/config/navigation";
import { useAuth } from "@/providers/auth";

interface HeaderNavProps {
  variant?: "default" | "dark"
  showTabs?: boolean
  subtitle?: string
}

export function HeaderNav({ variant = "default", showTabs = true, subtitle }: HeaderNavProps) {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);
  const { user, logout } = useAuth();
  const visibleTabs = getVisibleTabs(user?.role);

  const isDark = variant === "dark";

  return (
    <header className={cn("h-16 flex items-center px-6 shrink-0", isDark ? "bg-[#0a0b1a] border-b border-[#1e1f35]" : "bg-[#2563EB]")}>
      <div className="text-white font-bold text-base mr-8 shrink-0">
        Vital Monitoring
      </div>

      {showTabs ? (
        <nav className="flex items-center flex-1">
          {visibleTabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative px-4 h-16 flex items-center text-sm transition-colors",
                  isActive
                    ? "font-semibold text-white"
                    : "font-normal text-white/70 hover:text-white"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
                )}
              </Link>
            );
          })}
        </nav>
      ) : (
        <p className={cn("text-sm flex-1", isDark ? "text-[#808099]" : "text-white/70")}>{subtitle}</p>
      )}

      <div className="flex items-center gap-3 shrink-0">
        <span className={cn("text-sm", isDark ? "text-[#808099]" : "text-blue-100")}>{user?.role ?? "..."}</span>
        <div className={cn("size-8 rounded-full flex items-center justify-center text-white text-sm font-medium", isDark ? "bg-[#1e1f35]" : "bg-white/20")}>
          {user?.role?.[0] ?? "?"}
        </div>
        {showTabs ? (
          <Link
            href="/select"
            className={cn("flex items-center justify-center size-8 rounded-full transition-colors", isDark ? "bg-[#1e1f35] hover:bg-[#2a2b45] text-[#808099] hover:text-white" : "hover:bg-white/20 text-white/70 hover:text-white")}
            aria-label="Monitor Select"
          >
            <Monitor className="size-4" />
          </Link>
        ) : (
          <Link
            href="/admin/bed-status"
            className={cn("flex items-center justify-center size-8 rounded-full transition-colors", isDark ? "bg-[#1e1f35] hover:bg-[#2a2b45] text-[#808099] hover:text-white" : "hover:bg-white/20 text-white/70 hover:text-white")}
            aria-label="Dashboard"
          >
            <LayoutDashboard className="size-4" />
          </Link>
        )}
        <button
          onClick={() => logout()}
          className={cn("flex items-center justify-center size-8 rounded-full transition-colors", isDark ? "bg-[#1e1f35] hover:bg-[#2a2b45] text-[#808099] hover:text-white" : "hover:bg-white/20 text-white/70 hover:text-white")}
          aria-label="Logout"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}

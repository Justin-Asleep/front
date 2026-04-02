"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabs, getActiveTabId } from "@/config/navigation";
import { useAuth } from "@/providers/auth";

export function HeaderNav() {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-[#2563EB] flex items-center px-6 shrink-0">
      <div className="text-white font-bold text-base mr-8 shrink-0">
        Vital Monitoring
      </div>

      <nav className="flex items-center flex-1">
        {tabs.map((tab) => {
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

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-blue-100">{user?.role ?? "..."}</span>
        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
          {user?.role?.[0] ?? "?"}
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center justify-center size-8 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          aria-label="Logout"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}

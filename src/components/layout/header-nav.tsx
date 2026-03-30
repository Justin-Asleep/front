"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabs, getActiveTabId } from "@/lib/navigation";

export function HeaderNav() {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);

  return (
    <header className="h-16 bg-[#2563EB] flex items-center px-6 shrink-0">
      <div className="text-white font-bold text-lg mr-8 shrink-0">
        Vital Monitoring
      </div>

      <nav className="flex items-center gap-1 flex-1">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button className="text-blue-100 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10">
          <Bell size={20} />
        </button>
        <button className="text-blue-100 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}

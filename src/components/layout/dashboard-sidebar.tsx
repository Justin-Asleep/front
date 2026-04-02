"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarMenus, getActiveTabId } from "@/config/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);
  const menuItems = sidebarMenus[activeTabId] ?? [];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
      <div className="pt-5 pb-4">
        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3 px-5">
          {activeTabId === "central-monitor" ? "Central Monitor" : activeTabId.replace(/-/g, " ")}&nbsp;settings
        </p>
        <nav className="flex flex-col">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center h-11 text-sm transition-colors",
                  isActive
                    ? "bg-[#eff6ff] text-[#2563EB] font-semibold border-l-[3px] border-[#2563EB] pl-[17px]"
                    : "text-[#4b5563] font-normal hover:bg-gray-50 pl-5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

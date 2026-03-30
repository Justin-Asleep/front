"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarMenus, getActiveTabId } from "@/lib/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);
  const menuItems = sidebarMenus[activeTabId] ?? [];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {activeTabId.replace("-", " ")}
        </p>
        <nav className="flex flex-col gap-0.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-[#2563EB] border-l-[3px] border-[#2563EB]"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
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

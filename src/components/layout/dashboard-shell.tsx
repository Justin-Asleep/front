"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeaderNav } from "@/components/layout/header-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close overlay sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <HeaderNav onMenuClick={() => setMobileOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop / landscape tablet: static sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Portrait tablet / mobile: overlay drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="relative h-full shadow-xl">
              <DashboardSidebar onItemClick={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[#F9FAFB] p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

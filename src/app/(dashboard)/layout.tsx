import { HeaderNav } from "@/components/layout/header-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <HeaderNav />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

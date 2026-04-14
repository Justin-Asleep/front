import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/dashboard.webmanifest",
  appleWebApp: {
    capable: true,
    title: "A-Vital Monitoring",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

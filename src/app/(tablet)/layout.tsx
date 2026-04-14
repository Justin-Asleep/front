import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "A-Vital Tablet",
  manifest: "/tablet.webmanifest",
  appleWebApp: {
    capable: true,
    title: "A-Vital Tablet",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function TabletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

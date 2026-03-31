export type MenuItem = {
  label: string;
  href: string;
};

export type Tab = {
  id: string;
  label: string;
  href: string;
};

export const tabs: Tab[] = [
  { id: "patients", label: "Patients", href: "/patients/list" },
  { id: "devices", label: "Devices", href: "/devices/tablets" },
  { id: "monitoring", label: "Monitoring", href: "/monitoring/realtime-station" },
  { id: "central-monitor", label: "Central Monitor", href: "/central-monitor/stations" },
  { id: "admin", label: "Admin Settings", href: "/admin/bed-status" },
];

export const sidebarMenus: Record<string, MenuItem[]> = {
  patients: [
    { label: "Patient List", href: "/patients/list" },
    { label: "Admission", href: "/patients/admission" },
  ],
  devices: [
    { label: "Tablet Mgmt", href: "/devices/tablets" },
    { label: "Device Log", href: "/devices/log" },
  ],
  monitoring: [
    { label: "Realtime Station", href: "/monitoring/realtime-station" },
    { label: "Realtime Monitor", href: "/monitoring/realtime-monitor" },
  ],
  "central-monitor": [
    { label: "Station Reg", href: "/central-monitor/stations" },
    { label: "Monitor Reg", href: "/central-monitor/monitors" },
  ],
  admin: [
    { label: "Bed Status", href: "/admin/bed-status" },
    { label: "Hospital Info", href: "/admin/hospital-info" },
    { label: "Accounts", href: "/admin/accounts" },
    { label: "Wards", href: "/admin/wards" },
    { label: "Alarm Settings", href: "/admin/alarm-settings" },
  ],
};

export function getActiveTabId(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (segment === "central-monitor") return "central-monitor";
  return segment ?? "admin";
}

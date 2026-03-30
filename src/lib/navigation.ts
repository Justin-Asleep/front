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
  { id: "monitoring", label: "Monitoring", href: "/monitoring/realtime-monitor" },
  { id: "central-monitor", label: "Central Monitor", href: "/central-monitor/monitors" },
  { id: "admin", label: "Admin Settings", href: "/admin/hospital-info" },
];

export const sidebarMenus: Record<string, MenuItem[]> = {
  patients: [
    { label: "Patient List", href: "/patients/list" },
    { label: "Admission", href: "/patients/admission" },
    { label: "Measurement", href: "/patients/measurement" },
  ],
  devices: [
    { label: "Tablet Mgmt", href: "/devices/tablets" },
    { label: "Device Status", href: "/devices/status" },
    { label: "Device Log", href: "/devices/log" },
  ],
  monitoring: [
    { label: "Realtime Monitor", href: "/monitoring/realtime-monitor" },
    { label: "Station", href: "/monitoring/realtime-station" },
    { label: "Alarm Status", href: "/monitoring/alarm-status" },
    { label: "Bed Detail", href: "/monitoring/bed-detail" },
  ],
  "central-monitor": [
    { label: "Monitor Reg", href: "/central-monitor/monitors" },
    { label: "Station Reg", href: "/central-monitor/stations" },
    { label: "Bed Mapping", href: "/central-monitor/bed-mapping" },
    { label: "URL Keys", href: "/central-monitor/url-keys" },
  ],
  admin: [
    { label: "Hospital Info", href: "/admin/hospital-info" },
    { label: "Accounts", href: "/admin/accounts" },
    { label: "Wards", href: "/admin/wards" },
    { label: "Rooms", href: "/admin/rooms" },
    { label: "Alarm Settings", href: "/admin/alarm-settings" },
    { label: "Bed Status", href: "/admin/bed-status" },
  ],
};

export function getActiveTabId(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (segment === "central-monitor") return "central-monitor";
  return segment ?? "admin";
}

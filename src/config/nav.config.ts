import type { IconName } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n/translations";

export interface NavChild {
  labelKey: TranslationKey;
  href: string;
}

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: IconName;
  /** Set at render time from live data (open faults / unread notifications) — see Sidebar.tsx. */
  badgeKey?: "openFaults" | "unreadNotifications";
  children?: NavChild[];
}

export const primaryNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/", icon: "grid" },
  { labelKey: "nav.equipment", href: "/equipment", icon: "cpu" },
  {
    labelKey: "nav.location",
    href: "/location",
    icon: "map-pin",
    children: [{ labelKey: "nav.locationHealth", href: "/location/health" }],
  },
  { labelKey: "nav.documents", href: "/documents", icon: "file-text" },
  { labelKey: "nav.faults", href: "/faults", icon: "alert-triangle", badgeKey: "openFaults" },
  { labelKey: "nav.spareParts", href: "/spare-parts", icon: "package" },
  { labelKey: "nav.calibration", href: "/calibration", icon: "gauge" },
  { labelKey: "nav.reports", href: "/reports", icon: "bar-chart" },
  { labelKey: "nav.notifications", href: "/notifications", icon: "bell", badgeKey: "unreadNotifications" },
  { labelKey: "nav.users", href: "/users", icon: "users" },
  { labelKey: "nav.settings", href: "/settings", icon: "settings" },
];

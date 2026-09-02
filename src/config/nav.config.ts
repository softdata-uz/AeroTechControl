import type { IconName } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n/translations";
import { faults, notifications } from "@/lib/mock-data";

const openFaultsCount = faults.filter((f) => f.stage !== "closed").length;
const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

export interface NavChild {
  labelKey: TranslationKey;
  href: string;
}

export interface NavItem {
  labelKey: TranslationKey;
  href: string;
  icon: IconName;
  badge?: number;
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
  { labelKey: "nav.faults", href: "/faults", icon: "alert-triangle", badge: openFaultsCount },
  { labelKey: "nav.spareParts", href: "/spare-parts", icon: "package" },
  { labelKey: "nav.calibration", href: "/calibration", icon: "gauge" },
  { labelKey: "nav.reports", href: "/reports", icon: "bar-chart" },
  { labelKey: "nav.notifications", href: "/notifications", icon: "bell", badge: unreadNotificationsCount },
  { labelKey: "nav.users", href: "/users", icon: "users" },
  { labelKey: "nav.settings", href: "/settings", icon: "settings" },
];

import type { IconName } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n/translations";
import { faults, notifications, documents } from "@/lib/mock-data";

const openFaultsCount = faults.filter((f) => f.stage !== "closed").length;
const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
// Spare Parts nav item is temporarily disabled below — uncomment along with it.
// const lowOrOutOfStockCount = spareParts.filter(
//   (p) => p.status === "low_stock" || p.status === "out_of_stock"
// ).length;
const attentionDocumentsCount = documents.filter(
  (d) => d.status === "expiring" || d.status === "expired"
).length;

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
  { labelKey: "nav.location", href: "/location", icon: "map-pin" },
  { labelKey: "nav.documents", href: "/documents", icon: "file-text", badge: attentionDocumentsCount },
  // Inspections, Repairs, and Calibration no longer have standalone pages —
  // their records (acts, repair reports, certificates) live under Documents.
  { labelKey: "nav.faults", href: "/faults", icon: "alert-triangle", badge: openFaultsCount },
  // Temporarily disabled — not needed right now. Re-enable by uncommenting.
  // { labelKey: "nav.spareParts", href: "/spare-parts", icon: "package", badge: lowOrOutOfStockCount },
  { labelKey: "nav.reports", href: "/reports", icon: "bar-chart" },
  { labelKey: "nav.notifications", href: "/notifications", icon: "bell", badge: unreadNotificationsCount },
  { labelKey: "nav.users", href: "/users", icon: "users" },
  { labelKey: "nav.settings", href: "/settings", icon: "settings" },
];

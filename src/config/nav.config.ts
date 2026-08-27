import type { IconName } from "@/components/icons";
import { faults, notifications, spareParts, equipment, documents } from "@/lib/mock-data";

const TODAY = "2026-08-25";

const openFaultsCount = faults.filter((f) => f.stage !== "closed").length;
const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
const lowOrOutOfStockCount = spareParts.filter(
  (p) => p.status === "low_stock" || p.status === "out_of_stock"
).length;
const overdueCalibrationCount = equipment.filter(
  (e) => e.nextInspectionAt && e.nextInspectionAt < TODAY
).length;
const attentionDocumentsCount = documents.filter(
  (d) => d.status === "expiring" || d.status === "expired"
).length;

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
  children?: NavChild[];
}

export const primaryNav: NavItem[] = [
  { label: "Дашборд", href: "/", icon: "grid" },
  { label: "Реестр оборудования", href: "/equipment", icon: "cpu" },
  { label: "Расположение", href: "/location", icon: "map-pin" },
  // Sub-navigation (Календарь / График ТО / Чек-листы / Акты) is
  // deferred to Phase 3 — the Phase 2 page covers list + checklist
  // workflow inline, so no dead links are exposed here yet.
  { label: "Проверки и ТО", href: "/inspections", icon: "clipboard-check" },
  { label: "Неисправности", href: "/faults", icon: "alert-triangle", badge: openFaultsCount },
  { label: "Ремонты", href: "/repairs", icon: "wrench" },
  { label: "Запасные части", href: "/spare-parts", icon: "package", badge: lowOrOutOfStockCount },
  { label: "Поверка / Калибровка", href: "/calibration", icon: "gauge", badge: overdueCalibrationCount },
  { label: "Документы", href: "/documents", icon: "file-text", badge: attentionDocumentsCount },
  { label: "Отчеты и аналитика", href: "/reports", icon: "bar-chart" },
  { label: "Уведомления", href: "/notifications", icon: "bell", badge: unreadNotificationsCount },
  { label: "Пользователи", href: "/users", icon: "users" },
  { label: "Настройки", href: "/settings", icon: "settings" },
];

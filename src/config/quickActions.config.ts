import type { IconName } from "@/components/icons";
import type { TranslationKey } from "@/lib/i18n/translations";

export interface QuickAction {
  icon: IconName;
  labelKey: TranslationKey;
  href: string;
}

/**
 * Sidebar "Быстрые действия" — a 2x2 grid of contextual shortcuts that
 * changes with the current section (per the approved reference screens).
 * Keyed by the primary-nav href prefix; `default` covers every page that
 * doesn't have its own set (Dashboard, Equipment, Location, …).
 */
export const quickActionGroups: Record<string, QuickAction[]> = {
  default: [
    { icon: "cpu", labelKey: "quickAction.addEquipment", href: "/equipment/new" },
    { icon: "clipboard-check", labelKey: "quickAction.createInspection", href: "/documents?tab=inspections" },
    { icon: "alert-triangle", labelKey: "quickAction.createFault", href: "/faults" },
    { icon: "file-text", labelKey: "quickAction.addDocument", href: "/documents" },
  ],
  "/documents": [
    { icon: "clipboard-check", labelKey: "inspections.newInspection", href: "/documents?tab=inspections" },
    { icon: "wrench", labelKey: "quickAction.createRepair", href: "/documents?tab=repairs" },
    { icon: "file-text", labelKey: "quickAction.createAct", href: "/documents" },
    { icon: "camera", labelKey: "quickAction.uploadPhoto", href: "/documents?tab=inspections" },
  ],
  "/faults": [
    { icon: "alert-triangle", labelKey: "quickAction.createFault", href: "/faults" },
    { icon: "users", labelKey: "quickAction.assignExecutor", href: "/faults" },
    { icon: "package", labelKey: "quickAction.createSparePartOrder", href: "/spare-parts" },
    { icon: "wrench", labelKey: "quickAction.createRepair", href: "/documents?tab=repairs" },
  ],
};

export function quickActionsFor(pathname: string): QuickAction[] {
  const key = Object.keys(quickActionGroups).find((prefix) => prefix !== "default" && pathname.startsWith(prefix));
  return quickActionGroups[key ?? "default"];
}

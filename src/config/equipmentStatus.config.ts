import type { EquipmentStatus } from "@/lib/types";

export interface StatusVisual {
  label: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const equipmentStatusConfig: Record<EquipmentStatus, StatusVisual> = {
  operational: {
    label: "В работе",
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  maintenance: {
    label: "На обслуживании",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  faulty: {
    label: "Неисправно",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  reserve: {
    label: "Резерв",
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  requires_inspection: {
    label: "Требует поверки",
    dot: "bg-purple-500",
    badgeBg: "bg-(--chip-purple-bg)",
    badgeText: "text-(--chip-purple-text)",
    badgeBorder: "border-(--chip-purple-border)",
  },
  decommissioned: {
    label: "Выведено из эксплуатации",
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
};

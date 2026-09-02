import type { EquipmentStatus } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";

export interface StatusVisual {
  label: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

type StatusVisuals<K extends string> = Record<K, Omit<StatusVisual, "label">>;

const equipmentStatusVisuals: StatusVisuals<EquipmentStatus> = {
  faulty: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  operational: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  good: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  satisfactory: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  unsatisfactory: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  overdue: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  not_connected: {
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
};

export const equipmentStatusLabelKeys: Record<EquipmentStatus, TranslationKey> = {
  faulty: "status.equipment.faulty",
  operational: "status.equipment.operational",
  good: "status.equipment.good",
  satisfactory: "status.equipment.satisfactory",
  unsatisfactory: "status.equipment.unsatisfactory",
  overdue: "status.equipment.overdue",
  not_connected: "status.equipment.notConnected",
};

/** Build the locale-aware status config — call with `useTranslations()`'s `t`. */
export function getEquipmentStatusConfig(t: (key: TranslationKey) => string): Record<EquipmentStatus, StatusVisual> {
  return Object.fromEntries(
    Object.entries(equipmentStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(equipmentStatusLabelKeys[key as EquipmentStatus]) },
    ])
  ) as Record<EquipmentStatus, StatusVisual>;
}

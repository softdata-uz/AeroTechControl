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
  operational: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  maintenance: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  faulty: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  reserve: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  requires_inspection: {
    dot: "bg-purple-500",
    badgeBg: "bg-(--chip-purple-bg)",
    badgeText: "text-(--chip-purple-text)",
    badgeBorder: "border-(--chip-purple-border)",
  },
  decommissioned: {
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
};

export const equipmentStatusLabelKeys: Record<EquipmentStatus, TranslationKey> = {
  operational: "status.equipment.operational",
  maintenance: "status.equipment.maintenance",
  faulty: "status.equipment.faulty",
  reserve: "status.equipment.reserve",
  requires_inspection: "status.equipment.requiresInspection",
  decommissioned: "status.equipment.decommissioned",
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

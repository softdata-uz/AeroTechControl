import type { RepairStatus, SparePartStatus, DocumentStatus } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { StatusVisual } from "./equipmentStatus.config";

const repairStatusVisuals: Record<RepairStatus, Omit<StatusVisual, "label">> = {
  planned: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  in_progress: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  waiting_parts: {
    dot: "bg-purple-500",
    badgeBg: "bg-(--chip-purple-bg)",
    badgeText: "text-(--chip-purple-text)",
    badgeBorder: "border-(--chip-purple-border)",
  },
  completed: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  verified: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
};

export const repairStatusLabelKeys: Record<RepairStatus, TranslationKey> = {
  planned: "status.repair.planned",
  in_progress: "status.repair.inProgress",
  waiting_parts: "status.repair.waitingParts",
  completed: "status.repair.completed",
  verified: "status.repair.verified",
};

export function getRepairStatusConfig(t: (key: TranslationKey) => string): Record<RepairStatus, StatusVisual> {
  return Object.fromEntries(
    Object.entries(repairStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(repairStatusLabelKeys[key as RepairStatus]) },
    ])
  ) as Record<RepairStatus, StatusVisual>;
}

const sparePartStatusVisuals: Record<SparePartStatus, Omit<StatusVisual, "label">> = {
  available: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  low_stock: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  reserved: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  out_of_stock: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
};

export const sparePartStatusLabelKeys: Record<SparePartStatus, TranslationKey> = {
  available: "status.sparePart.available",
  low_stock: "status.sparePart.lowStock",
  reserved: "status.sparePart.reserved",
  out_of_stock: "status.sparePart.outOfStock",
};

export function getSparePartStatusConfig(t: (key: TranslationKey) => string): Record<SparePartStatus, StatusVisual> {
  return Object.fromEntries(
    Object.entries(sparePartStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(sparePartStatusLabelKeys[key as SparePartStatus]) },
    ])
  ) as Record<SparePartStatus, StatusVisual>;
}

const documentStatusVisuals: Record<DocumentStatus, Omit<StatusVisual, "label">> = {
  draft: {
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
  active: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  expiring: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  expired: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  archived: {
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
};

export const documentStatusLabelKeys: Record<DocumentStatus, TranslationKey> = {
  draft: "status.document.draft",
  active: "status.document.active",
  expiring: "status.document.expiring",
  expired: "status.document.expired",
  archived: "status.document.archived",
};

export function getDocumentStatusConfig(t: (key: TranslationKey) => string): Record<DocumentStatus, StatusVisual> {
  return Object.fromEntries(
    Object.entries(documentStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(documentStatusLabelKeys[key as DocumentStatus]) },
    ])
  ) as Record<DocumentStatus, StatusVisual>;
}

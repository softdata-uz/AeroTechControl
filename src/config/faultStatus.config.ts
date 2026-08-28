import type { FaultStage, FaultPriority } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { StatusVisual } from "./equipmentStatus.config";

export const faultStageOrder: FaultStage[] = [
  "detected",
  "registered",
  "assigned",
  "diagnosis",
  "repair",
  "verification",
  "closed",
];

/** Lifecycle chip labels (Detected -> Closed) — distinct text from the badge labels below. */
export const faultStageLabelKeys: Record<FaultStage, TranslationKey> = {
  detected: "faultStage.detected",
  registered: "faultStage.registered",
  assigned: "faultStage.assigned",
  diagnosis: "faultStage.diagnosis",
  repair: "faultStage.repair",
  verification: "faultStage.verification",
  closed: "faultStage.closed",
};

export function getFaultStageLabels(t: (key: TranslationKey) => string): Record<FaultStage, string> {
  return Object.fromEntries(
    faultStageOrder.map((stage) => [stage, t(faultStageLabelKeys[stage])])
  ) as Record<FaultStage, string>;
}

const faultStatusVisuals: Record<FaultStage, Omit<StatusVisual, "label">> = {
  detected: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  registered: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  assigned: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  diagnosis: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  repair: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  verification: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  closed: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
};

export const faultStatusLabelKeys: Record<FaultStage, TranslationKey> = {
  detected: "status.fault.detected",
  registered: "status.fault.registered",
  assigned: "status.fault.assigned",
  diagnosis: "status.fault.diagnosis",
  repair: "status.fault.repair",
  verification: "status.fault.verification",
  closed: "status.fault.closed",
};

export function getFaultStatusConfig(t: (key: TranslationKey) => string): Record<FaultStage, StatusVisual> {
  return Object.fromEntries(
    Object.entries(faultStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(faultStatusLabelKeys[key as FaultStage]) },
    ])
  ) as Record<FaultStage, StatusVisual>;
}

const faultPriorityVisuals: Record<FaultPriority, Omit<StatusVisual, "label">> = {
  low: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  medium: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  high: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  critical: {
    dot: "bg-error-600",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
};

export const faultPriorityLabelKeys: Record<FaultPriority, TranslationKey> = {
  low: "status.faultPriority.low",
  medium: "status.faultPriority.medium",
  high: "status.faultPriority.high",
  critical: "status.faultPriority.critical",
};

export function getFaultPriorityConfig(t: (key: TranslationKey) => string): Record<FaultPriority, StatusVisual> {
  return Object.fromEntries(
    Object.entries(faultPriorityVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(faultPriorityLabelKeys[key as FaultPriority]) },
    ])
  ) as Record<FaultPriority, StatusVisual>;
}

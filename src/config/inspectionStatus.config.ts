import type { InspectionStatus, ChecklistResult } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { StatusVisual } from "./equipmentStatus.config";

const inspectionStatusVisuals: Record<InspectionStatus, Omit<StatusVisual, "label">> = {
  planned: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  in_progress: {
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  completed: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  overdue: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  requires_review: {
    dot: "bg-purple-500",
    badgeBg: "bg-(--chip-purple-bg)",
    badgeText: "text-(--chip-purple-text)",
    badgeBorder: "border-(--chip-purple-border)",
  },
};

export const inspectionStatusLabelKeys: Record<InspectionStatus, TranslationKey> = {
  planned: "status.inspection.planned",
  in_progress: "status.inspection.inProgress",
  completed: "status.inspection.completed",
  overdue: "status.inspection.overdue",
  requires_review: "status.inspection.requiresReview",
};

export function getInspectionStatusConfig(
  t: (key: TranslationKey) => string
): Record<InspectionStatus, StatusVisual> {
  return Object.fromEntries(
    Object.entries(inspectionStatusVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(inspectionStatusLabelKeys[key as InspectionStatus]) },
    ])
  ) as Record<InspectionStatus, StatusVisual>;
}

const checklistResultVisuals: Record<ChecklistResult, Omit<StatusVisual, "label">> = {
  compliant: {
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  non_compliant: {
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  not_applicable: {
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
  pending: {
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
};

export const checklistResultLabelKeys: Record<ChecklistResult, TranslationKey> = {
  compliant: "status.checklist.compliant",
  non_compliant: "status.checklist.nonCompliant",
  not_applicable: "status.checklist.notApplicable",
  pending: "status.checklist.pending",
};

export function getChecklistResultConfig(t: (key: TranslationKey) => string): Record<ChecklistResult, StatusVisual> {
  return Object.fromEntries(
    Object.entries(checklistResultVisuals).map(([key, visual]) => [
      key,
      { ...visual, label: t(checklistResultLabelKeys[key as ChecklistResult]) },
    ])
  ) as Record<ChecklistResult, StatusVisual>;
}

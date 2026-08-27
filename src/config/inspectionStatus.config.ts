import type { InspectionStatus, ChecklistResult } from "@/lib/types";
import type { StatusVisual } from "./equipmentStatus.config";

export const inspectionStatusConfig: Record<InspectionStatus, StatusVisual> = {
  planned: {
    label: "Запланирована",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  in_progress: {
    label: "В работе",
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  completed: {
    label: "Выполнено",
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  overdue: {
    label: "Просрочено",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  requires_review: {
    label: "Требует проверки",
    dot: "bg-purple-500",
    badgeBg: "bg-(--chip-purple-bg)",
    badgeText: "text-(--chip-purple-text)",
    badgeBorder: "border-(--chip-purple-border)",
  },
};

export const checklistResultConfig: Record<ChecklistResult, StatusVisual> = {
  compliant: {
    label: "Соответствует",
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
  non_compliant: {
    label: "Не соответствует",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  not_applicable: {
    label: "Не применимо",
    dot: "bg-gray-500",
    badgeBg: "bg-(--chip-gray-bg)",
    badgeText: "text-(--chip-gray-text)",
    badgeBorder: "border-(--chip-gray-border)",
  },
  pending: {
    label: "Ожидает проверки",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
};

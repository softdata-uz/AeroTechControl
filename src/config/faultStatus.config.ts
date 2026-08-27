import type { FaultStage, FaultPriority } from "@/lib/types";
import type { StatusVisual } from "./equipmentStatus.config";

export const faultStageLabels: Record<FaultStage, string> = {
  detected: "Обнаружена",
  registered: "Зарегистрирована",
  assigned: "Назначена",
  diagnosis: "Диагностика",
  repair: "Ремонт",
  verification: "Проверка",
  closed: "Закрыта",
};

export const faultStageOrder: FaultStage[] = [
  "detected",
  "registered",
  "assigned",
  "diagnosis",
  "repair",
  "verification",
  "closed",
];

export const faultStatusConfig: Record<FaultStage, StatusVisual> = {
  detected: {
    label: "Обнаружена",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  registered: {
    label: "Открытая",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  assigned: {
    label: "Назначена",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  diagnosis: {
    label: "Диагностика",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  repair: {
    label: "В работе",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  verification: {
    label: "Ожидает проверки",
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  closed: {
    label: "Устранена",
    dot: "bg-success-500",
    badgeBg: "bg-(--chip-success-bg)",
    badgeText: "text-(--chip-success-text)",
    badgeBorder: "border-(--chip-success-border)",
  },
};

export const faultPriorityConfig: Record<FaultPriority, StatusVisual> = {
  low: {
    label: "Низкий",
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
  medium: {
    label: "Средний",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  high: {
    label: "Высокий",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  critical: {
    label: "Критический",
    dot: "bg-error-600",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
};

import type { UserRole } from "@/lib/types";

/**
 * Frontend-only role-based UI simulation (CLAUDE.md §31) — this is NOT
 * authorization. It only controls which sidebar sections are shown so
 * each role's screen matches its real-world job, e.g. an Engineer isn't
 * shown Users/Settings, a Spare Parts Manager isn't shown Reports.
 */
export const roleNavAccess: Record<UserRole, string[]> = {
  engineer: ["/", "/equipment", "/location", "/inspections", "/faults", "/repairs"],
  lead_engineer: [
    "/",
    "/equipment",
    "/location",
    "/inspections",
    "/faults",
    "/repairs",
    "/spare-parts",
    "/calibration",
    "/reports",
    "/notifications",
  ],
  spare_parts_manager: ["/", "/equipment", "/spare-parts", "/repairs", "/notifications"],
  central_office: ["/", "/equipment", "/location", "/reports", "/documents", "/notifications"],
  administrator: [
    "/",
    "/equipment",
    "/location",
    "/inspections",
    "/faults",
    "/repairs",
    "/spare-parts",
    "/calibration",
    "/documents",
    "/reports",
    "/notifications",
    "/users",
    "/settings",
  ],
  auditor: ["/", "/equipment", "/inspections", "/faults", "/documents", "/reports"],
};

export const roleDescriptions: Record<UserRole, string> = {
  engineer: "Проверки, назначенные неисправности, оборудование, оперативные задачи",
  lead_engineer: "Утверждения, контроль команды, отчеты, операционный обзор",
  spare_parts_manager: "Склад, резервирование, движение запасных частей",
  central_office: "Все аэропорты, консолидированная аналитика, мониторинг",
  administrator: "Пользователи, справочники, настройки — полный доступ",
  auditor: "История в режиме только чтения, документы, отчеты",
};

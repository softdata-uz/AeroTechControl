import type { UserRole } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";

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
  spare_parts_manager: ["/", "/equipment", "/spare-parts", "/notifications"],
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
  auditor: ["/", "/equipment", "/faults", "/documents", "/reports"],
};

// Translation-key variants used by every locale-aware surface that shows a
// role label or description (Topbar, Settings, Users). `roleLabels` in
// `lib/mock-data.ts` is a separate, Russian-only export used only where a
// plain string (not a TranslationKey) is needed, e.g. as a `Record` key
// source for building filter option lists.
export const roleLabelKeys: Record<UserRole, TranslationKey> = {
  engineer: "role.engineer",
  lead_engineer: "role.leadEngineer",
  spare_parts_manager: "role.sparePartsManager",
  central_office: "role.centralOffice",
  administrator: "role.administrator",
  auditor: "role.auditor",
};

export const roleDescriptionKeys: Record<UserRole, TranslationKey> = {
  engineer: "roleDesc.engineer",
  lead_engineer: "roleDesc.leadEngineer",
  spare_parts_manager: "roleDesc.sparePartsManager",
  central_office: "roleDesc.centralOffice",
  administrator: "roleDesc.administrator",
  auditor: "roleDesc.auditor",
};

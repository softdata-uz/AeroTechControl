"use client";

import { useRole } from "@/lib/role-context";

const READ_ONLY_ROLES = ["lead_engineer", "central_office"];

/** Mirrors the backend's ReadOnlyRoleGuard — Lead Engineer and Central
 * Office cannot create/edit/delete operational data (equipment,
 * inspections, faults, repairs, spare parts, documents). UI gating only;
 * the real boundary is server-side. */
export function usePermissions() {
  const { role } = useRole();
  return { canWrite: !READ_ONLY_ROLES.includes(role) };
}

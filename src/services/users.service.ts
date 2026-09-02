import type { AppUser, UserRole } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiDownload, type Page } from "./http-client";

export interface UserFilters {
  role?: UserRole;
  airportId?: number;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /users
export function listUsers(filters: UserFilters = {}): Promise<Page<AppUser>> {
  return apiGetPage<AppUser>("/users", filters);
}

// GET /users/:id
export function getUser(id: number): Promise<AppUser> {
  return apiGet<AppUser>(`/users/${id}`);
}

// GET /users/export
export function exportUsers(filters: UserFilters = {}): Promise<void> {
  return apiDownload("/users/export", filters, "users.xlsx");
}

// PATCH /users/:id/active
export function setUserActive(id: number, active: boolean): Promise<AppUser> {
  return apiPatch<AppUser>(`/users/${id}/active`, { active });
}

// PATCH /users/:id/role (administrator only)
export function setUserRole(id: number, role: UserRole): Promise<AppUser> {
  return apiPatch<AppUser>(`/users/${id}/role`, { role });
}

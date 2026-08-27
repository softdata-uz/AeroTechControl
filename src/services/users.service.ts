import type { AppUser, UserRole } from "@/lib/types";
import { users as userSeed } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface UserFilters {
  role?: UserRole;
  airportId?: string;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /users
export function listUsers(filters: UserFilters = {}): Promise<Page<AppUser>> {
  return resolve(() => {
    let items = userSeed;
    if (filters.role) items = items.filter((u) => u.role === filters.role);
    if (filters.airportId) items = items.filter((u) => u.airportId === filters.airportId);
    if (filters.active !== undefined) items = items.filter((u) => u.active === filters.active);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /users/:id
export function getUser(id: string): Promise<AppUser> {
  return resolve(() => userSeed.find((u) => u.id === id)).then((u) => {
    if (!u) return reject(404, `User ${id} not found`) as Promise<AppUser>;
    return u;
  });
}

// PATCH /users/:id/active
export function setUserActive(id: string, active: boolean): Promise<AppUser> {
  return mutate(() => {
    const u = userSeed.find((u) => u.id === id);
    if (!u) throw new Error(`User ${id} not found`);
    u.active = active;
    return u;
  });
}

// PATCH /users/:id/role
export function setUserRole(id: string, role: UserRole): Promise<AppUser> {
  return mutate(() => {
    const u = userSeed.find((u) => u.id === id);
    if (!u) throw new Error(`User ${id} not found`);
    u.role = role;
    return u;
  });
}

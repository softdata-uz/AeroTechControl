// Real session lookup. Role-preview switching (CLAUDE.md §31 — UI
// simulation, not real authorization) lives in src/lib/role-context.tsx and
// sources sample users via usersService.listUsers, not this file.

import type { AppUser } from "@/lib/types";
import { apiGet, apiPost } from "./http-client";
import { getRefreshToken } from "@/lib/auth-token";

// GET /auth/me
export function getCurrentUser(): Promise<AppUser> {
  return apiGet<AppUser>("/auth/me");
}

// POST /auth/logout
export function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve();
  return apiPost<void>("/auth/logout", { refreshToken });
}

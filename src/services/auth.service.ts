// Frontend role simulation only — no real authentication/authorization.
// Matches CLAUDE.md §31: the UI adapts to a selected role, it does not enforce security.

import type { AppUser } from "@/lib/types";
import { currentUser, users as userSeed } from "@/lib/mock-data";
import { resolve, reject } from "./http-client";

// GET /auth/me
export function getCurrentUser(): Promise<AppUser> {
  return resolve(() => currentUser);
}

// POST /auth/switch-role  (dev/demo affordance for role-based UI simulation)
export function switchToUser(userId: string): Promise<AppUser> {
  return resolve(() => userSeed.find((u) => u.id === userId)).then((u) => {
    if (!u) return reject(404, `User ${userId} not found`) as Promise<AppUser>;
    return u;
  });
}

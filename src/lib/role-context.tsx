"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { currentUser, users } from "@/lib/mock-data";
import type { UserRole, AppUser } from "@/lib/types";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: AppUser;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(currentUser.role);

  // Simulated session — keeps the signed-in identity but previews the
  // sidebar/topbar as if that identity held a different role, matching
  // CLAUDE.md §31 ("UI simulation", not real authorization).
  const user = useMemo<AppUser>(() => {
    if (role === currentUser.role) return currentUser;
    const sample = users.find((u) => u.role === role);
    return sample ?? { ...currentUser, role };
  }, [role]);

  return <RoleContext.Provider value={{ role, setRole, user }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}

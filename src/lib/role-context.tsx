"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole, AppUser } from "@/lib/types";
import { authService, usersService } from "@/services";
import { getAccessToken, clearTokens } from "@/lib/auth-token";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  user: AppUser;
  status: AuthStatus;
  logout: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const PLACEHOLDER_USER: AppUser = {
  id: 0,
  fullName: "",
  login: "",
  email: null,
  role: "engineer",
  airportId: null,
  active: true,
  lastActiveAt: null,
  image: null,
  imageUrl: null,
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [realUser, setRealUser] = useState<AppUser | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [previewUser, setPreviewUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!getAccessToken()) {
      setStatus("unauthenticated");
      return;
    }
    authService
      .getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setRealUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        clearTokens();
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Simulated preview — keeps the signed-in identity but previews the
  // sidebar/topbar as if that identity held a different role, matching
  // CLAUDE.md §31 ("UI simulation", not real authorization).
  useEffect(() => {
    if (!previewRole || !realUser || previewRole === realUser.role) {
      setPreviewUser(null);
      return;
    }
    let cancelled = false;
    usersService
      .listUsers({ role: previewRole, pageSize: 1 })
      .then((page) => {
        if (!cancelled) setPreviewUser(page.items[0] ?? { ...realUser, role: previewRole });
      })
      .catch(() => {
        if (!cancelled) setPreviewUser({ ...realUser, role: previewRole });
      });
    return () => {
      cancelled = true;
    };
  }, [previewRole, realUser]);

  const user = previewUser ?? realUser ?? PLACEHOLDER_USER;
  const role = previewRole ?? realUser?.role ?? PLACEHOLDER_USER.role;

  function logout() {
    authService.logout().finally(() => {
      clearTokens();
      window.location.assign("/login");
    });
  }

  const value = useMemo<RoleContextValue>(
    () => ({ role, setRole: setPreviewRole, user, status, logout }),
    [role, user, status]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}

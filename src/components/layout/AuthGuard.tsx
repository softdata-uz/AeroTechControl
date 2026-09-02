"use client";

import { useEffect, type ReactNode } from "react";
import { useRole } from "@/lib/role-context";

// Gates the (app) route group behind a real session. Renders nothing while
// the session check is in flight, redirects to /login when there is no
// valid session, and only then renders children — so every descendant can
// assume `useRole().user` is a real, non-null AppUser.
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useRole();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.assign("/login");
    }
  }, [status]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-primary border-t-brand-500" />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useRole } from "@/lib/role-context";
import { useTranslations } from "@/lib/locale-context";
import { roleLabelKeys } from "@/config/roleAccess.config";
import { cn } from "@/lib/cn";

/**
 * Topbar avatar dropdown — same portal + outside-click pattern as
 * `LanguageMenu.tsx`/`NotificationsMenu.tsx`. Replaces the old plain
 * "avatar links straight to /settings" + separate logout icon button
 * with a real menu: Account (personal settings) and Log out.
 */
export function AccountMenu() {
  const { user, logout } = useRole();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  function place() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onReposition() {
      place();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          place();
          setOpen(true);
        }}
        className="flex h-10 items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-bg-tertiary"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold leading-tight text-text-primary">{user.fullName}</p>
          <p className="text-xs leading-tight text-text-tertiary">{t(roleLabelKeys[user.role])}</p>
        </div>
        <Icon
          name="chevron-down"
          size={14}
          className={cn("text-text-quaternary transition-transform", open && "rotate-180")}
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="z-[60] w-44 overflow-hidden rounded-lg border border-border-primary bg-bg-secondary p-1 shadow-lg"
          >
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <Icon name="user" size={16} />
              {t("topbar.account")}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <Icon name="log-out" size={16} />
              {t("topbar.logout")}
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

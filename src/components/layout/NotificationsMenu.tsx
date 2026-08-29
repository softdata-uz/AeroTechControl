"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { CountBadge } from "@/components/ui/Badge";
import { notifications } from "@/lib/mock-data";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

const MAX_ITEMS = 6;

/**
 * Topbar bell dropdown — same portal + outside-click pattern as
 * `LanguageMenu.tsx`, but sized to show a short list of recent
 * notifications with a link through to the full `/notifications` page.
 */
export function NotificationsMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const items = notifications.slice(0, MAX_ITEMS);

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
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t("topbar.notifications")}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          place();
          setOpen(true);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1">
            <CountBadge count={unreadCount} />
          </span>
        )}
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="z-[60] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border-primary bg-bg-secondary shadow-lg"
          >
            <div className="border-b border-border-secondary px-4 py-2.5">
              <p className="text-sm font-semibold text-text-primary">{t("dashboard.notifications")}</p>
            </div>
            <ul className="max-h-[360px] divide-y divide-border-secondary overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-2.5">
                  <Icon
                    name={n.severity === "critical" ? "alert-triangle" : n.severity === "warning" ? "clock" : "bell"}
                    size={16}
                    className={cn(
                      "mt-0.5 shrink-0",
                      n.severity === "critical" ? "text-error-400" : n.severity === "warning" ? "text-warning-400" : "text-brand-400"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{n.title}</p>
                    <p className="truncate text-xs text-text-tertiary">{n.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-quaternary">
                    {new Date(`${n.createdAt}T${n.severity === "critical" ? "10:15" : n.severity === "warning" ? "10:30" : "09:45"}:00`).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-border-secondary px-4 py-2.5 text-center text-xs font-medium text-brand-400 hover:text-brand-300"
            >
              {t("common.viewAll")}
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}

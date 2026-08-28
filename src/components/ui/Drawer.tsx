"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Right-side slide-over — the "6–10 fields" tier of `pickFormLayout`
 * (src/lib/form-layout.ts). Same header/body/footer anatomy as `Modal`
 * so the two read as one system, just docked instead of centered —
 * appropriate for a form long enough to want more vertical room than a
 * centered dialog comfortably gives, but not long enough to earn its
 * own route.
 */
export function Drawer({ open, onClose, title, description, children, footer, size = "md" }: DrawerProps) {
  const t = useTranslations();
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-bg-overlay/70 backdrop-blur-[2px]">
      <button aria-label={t("common.close")} onClick={onClose} className="fixed inset-0 -z-10 cursor-default" tabIndex={-1} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "animate-drawer-in flex h-full w-full flex-col border-l border-border-primary bg-bg-secondary shadow-lg",
          size === "lg" ? "max-w-xl" : "max-w-md"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-secondary px-5 py-4">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 rounded-md p-1.5 text-text-quaternary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-border-secondary px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

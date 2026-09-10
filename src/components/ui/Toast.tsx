"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

interface ToastProps {
  /** `null` renders nothing — the caller owns the message state. */
  message: string | null;
  onDismiss: () => void;
  /** ms before auto-dismiss. */
  duration?: number;
}

/**
 * Bottom-center transient notice for informational, no-decision-required
 * outcomes (e.g. "nothing here") — deliberately lighter than `Modal`, which
 * is for confirmations/forms. No provider/global queue: a page owns one
 * `useState<string | null>` and passes it straight through.
 */
export function Toast({ message, onDismiss, duration = 3200 }: ToastProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  // Two-phase mount so the enter transition actually plays (starting the
  // "visible" class in the same render as the "hidden" one skips the
  // transition entirely).
  useEffect(() => {
    if (!message) {
      setMounted(false);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    const timeout = setTimeout(onDismiss, duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary px-4 py-3 shadow-lg transition-all duration-200 ease-out",
          mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--chip-brand-bg) text-(--chip-brand-text)">
          <Icon name="map-pin" size={14} />
        </span>
        <p className="text-sm text-text-primary">{message}</p>
        <button
          onClick={onDismiss}
          aria-label={t("common.close")}
          className="ml-1 shrink-0 rounded-md p-1 text-text-quaternary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
}

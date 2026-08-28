"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { useLocale } from "@/lib/locale-context";
import { locales, localeLabels } from "@/lib/i18n/translations";
import { cn } from "@/lib/cn";

/**
 * Compact topbar language switcher — same portal + outside-click pattern
 * as `ui/Dropdown.tsx`, but sized to sit inline with the icon buttons
 * (bell/help/theme) instead of taking a full form-field width.
 */
export function LanguageMenu() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("settings.language")}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          place();
          setOpen(true);
        }}
        className="flex h-10 items-center gap-1 rounded-lg px-2 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <Icon name="globe" size={20} />
        <span className="text-xs font-semibold uppercase">{locale}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="z-[60] w-40 overflow-hidden rounded-lg border border-border-primary bg-bg-secondary p-1 shadow-lg"
          >
            {locales.map((l) => {
              const isSelected = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-(--chip-brand-bg) text-(--chip-brand-text)"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  <span className="truncate font-medium">{localeLabels[l]}</span>
                  {isSelected && <Icon name="check" size={14} strokeWidth={2.2} className="shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  searchable?: boolean;
}

/**
 * Checkbox-list multiselect — same portal/positioning mechanics as
 * `Dropdown`, but the popover stays open across picks and the trigger
 * shows a count summary instead of a single label.
 */
export function MultiSelectDropdown({
  options,
  values,
  onChange,
  placeholder,
  label,
  required,
  disabled,
  error,
  className,
  searchable,
}: MultiSelectDropdownProps) {
  const t = useTranslations();
  const resolvedPlaceholder = placeholder ?? t("common.selectPlaceholder");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedLabels = useMemo(
    () => options.filter((o) => values.includes(o.value)).map((o) => o.label),
    [options, values]
  );

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchable, query]);

  function place() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const MENU_MAX_HEIGHT = 288;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    setCoords(
      openAbove
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width }
    );
  }

  function openMenu() {
    if (disabled) return;
    place();
    setQuery("");
    setOpen(true);
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

  function toggle(optionValue: string) {
    if (values.includes(optionValue)) {
      onChange(values.filter((v) => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  }

  const destructive = !!error;
  const summary =
    selectedLabels.length === 0
      ? resolvedPlaceholder
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels.length} ${t("common.selected")}`;

  const field = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : openMenu())}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-md border bg-bg-primary px-3 text-left text-sm shadow-xs outline-none transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "border-error-400 focus-visible:border-error-500 focus-visible:ring-1 focus-visible:ring-error-500"
          : "border-border-primary hover:border-border-secondary focus-visible:border-brand-500 focus-visible:ring-1 focus-visible:ring-brand-500"
      )}
    >
      <span className={cn("flex-1 truncate", selectedLabels.length > 0 ? "text-text-primary" : "text-text-placeholder")}>
        {summary}
      </span>
      <Icon name="chevron-down" size={16} className={cn("shrink-0 text-text-quaternary transition-transform", open && "rotate-180")} />
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error-400">*</span>}
        </label>
      )}
      {field}
      {error && <p className="mt-1.5 text-xs text-error-400">{error}</p>}

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            aria-multiselectable
            style={{ position: "fixed", top: coords.top, bottom: coords.bottom, left: coords.left, minWidth: coords.width }}
            className="z-[60] flex max-h-80 flex-col rounded-lg border border-border-primary bg-bg-secondary p-1 shadow-lg"
          >
            {searchable && (
              <div className="relative mb-1 shrink-0 px-0.5 pt-0.5">
                <Icon
                  name="search"
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-quaternary"
                />
                <input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.searchPlaceholder")}
                  className="h-8 w-full rounded-md border border-border-primary bg-bg-primary pl-7 pr-2 text-xs text-text-primary outline-none placeholder:text-text-placeholder focus:border-brand-500"
                />
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredOptions.length === 0 && (
                <p className="px-3 py-2 text-xs text-text-quaternary">{t("common.noOptions")}</p>
              )}
              {filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isSelected ? "bg-(--chip-brand-bg) text-(--chip-brand-text)" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                  >
                    <Checkbox checked={isSelected} onChange={() => toggle(opt.value)} />
                    <span className="min-w-0 flex-1 truncate font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

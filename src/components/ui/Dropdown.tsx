"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: IconName;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Custom-styled single-select — Figma "Dropdown"/"Select" (18666:11596 /
 * 18666:11661): a real menu with hover/selected states instead of the
 * browser's native `<select>` popup, for forms where visual polish
 * matters. Portalled to <body> (same technique as DatePicker) so it
 * never gets clipped by a Modal/Drawer/table's overflow container.
 *
 * Filter bars and other high-volume, low-stakes selects should keep
 * using the plain `<Select>` (ui/Input.tsx) — that one is a native
 * `<select>`, which is cheaper to wire up and already accessible by
 * default; reach for `Dropdown` when the extra visual weight earns its
 * keep (primary forms, record status, single decisive choices).
 */
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Выберите",
  label,
  required,
  disabled,
  error,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  function place() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  function openMenu() {
    if (disabled) return;
    place();
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

  const destructive = !!error;

  const field = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : openMenu())}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border bg-bg-primary px-3 text-left text-sm shadow-xs outline-none transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "border-error-400 focus-visible:border-error-500 focus-visible:ring-1 focus-visible:ring-error-500"
          : "border-border-primary hover:border-border-secondary focus-visible:border-brand-500 focus-visible:ring-1 focus-visible:ring-brand-500"
      )}
    >
      {selected?.icon && <Icon name={selected.icon} size={16} className="shrink-0 text-text-quaternary" />}
      <span className={cn("flex-1 truncate", selected ? "text-text-primary" : "text-text-placeholder")}>
        {selected ? selected.label : placeholder}
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
            style={{ position: "fixed", top: coords.top, left: coords.left, minWidth: coords.width }}
            className="z-[60] max-h-72 overflow-y-auto rounded-lg border border-border-primary bg-bg-secondary p-1 shadow-lg"
          >
            {options.length === 0 && <p className="px-3 py-2 text-xs text-text-quaternary">Нет вариантов</p>}
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    isSelected ? "bg-(--chip-brand-bg) text-(--chip-brand-text)" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  {opt.icon && <Icon name={opt.icon} size={16} className="shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{opt.label}</span>
                    {opt.description && <span className="block truncate text-xs opacity-70">{opt.description}</span>}
                  </span>
                  {isSelected && <Icon name="check" size={15} strokeWidth={2.2} className="shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

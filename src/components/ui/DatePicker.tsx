"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

const WEEKDAY_KEYS = [
  "common.weekdayMon", "common.weekdayTue", "common.weekdayWed", "common.weekdayThu",
  "common.weekdayFri", "common.weekdaySat", "common.weekdaySun",
] as const;
const MONTH_KEYS = [
  "common.monthJan", "common.monthFeb", "common.monthMar", "common.monthApr",
  "common.monthMay", "common.monthJun", "common.monthJul", "common.monthAug",
  "common.monthSep", "common.monthOct", "common.monthNov", "common.monthDec",
] as const;

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface CalendarProps {
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}

/** Month grid — Figma "Date picker menu" → Calendar (18666:82818). Weeks
 * start Monday, out-of-month days are muted, today gets a ring, the
 * selected day is a solid brand-filled circle. */
export function Calendar({ value, onChange, className }: CalendarProps) {
  const t = useTranslations();
  const WEEKDAYS = WEEKDAY_KEYS.map((k) => t(k));
  const MONTHS = MONTH_KEYS.map((k) => t(k));
  const selected = value ? fromISO(value) : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startOffset; i > 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth, 1 - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  function shiftMonth(delta: number) {
    const next = viewMonth + delta;
    if (next < 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else if (next > 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth(next);
    }
  }

  return (
    <div className={cn("select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label={t("common.previousMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name="chevron-left" size={18} />
        </button>
        <p className="text-sm font-semibold text-text-primary">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label={t("common.nextMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1.5 text-xs font-medium text-text-quaternary">
            {w}
          </span>
        ))}
        {cells.map(({ date, inMonth }, i) => {
          const isSelected = !!selected && sameDay(date, selected);
          const isToday = sameDay(date, today);
          return (
            <button
              type="button"
              key={i}
              onClick={() => onChange(toISO(date))}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                isSelected
                  ? "bg-brand-600 font-medium text-white"
                  : inMonth
                    ? cn(
                        "text-text-secondary hover:bg-bg-tertiary",
                        isToday && "border border-brand-500 font-medium text-text-primary"
                      )
                    : "text-text-quaternary/50 hover:bg-bg-tertiary"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DatePickerProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/** Input trigger + popover Calendar with Cancel/Apply — Figma "Date picker
 * dropdown" (18666:82818). Draft state means Cancel reverts without
 * committing, matching the reference anatomy. */
export function DatePicker({ value, onChange, placeholder, label, className }: DatePickerProps) {
  const t = useTranslations();
  const resolvedPlaceholder = placeholder ?? t("common.selectDate");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  function place() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
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
    <div className={cn("relative", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-border-primary bg-bg-primary px-3 text-left text-sm shadow-xs outline-none transition-colors",
          "hover:border-border-secondary focus-visible:border-brand-500 focus-visible:ring-1 focus-visible:ring-brand-500"
        )}
      >
        <Icon name="calendar-date" size={16} className="shrink-0 text-text-quaternary" />
        <span className={cn("flex-1 truncate", value ? "text-text-primary" : "text-text-placeholder")}>
          {value ? formatDate(value) : resolvedPlaceholder}
        </span>
      </button>

      {/* Portalled to <body> so the popover escapes any clipping/overflow
          ancestor (modals, table wrappers, etc.) — positioned from the
          trigger's live viewport rect, recomputed on scroll/resize. */}
      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, minWidth: Math.max(coords.width, 300) }}
            className="z-[60] w-[300px] rounded-xl border border-border-primary bg-bg-secondary p-4 shadow-lg"
          >
            <Calendar value={draft} onChange={setDraft} />
            <div className="mt-3 flex gap-2 border-t border-border-secondary pt-3">
              <Button hierarchy="secondary" size="sm" className="flex-1 justify-center" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                hierarchy="primary"
                size="sm"
                className="flex-1 justify-center"
                onClick={() => {
                  if (draft) onChange(draft);
                  setOpen(false);
                }}
              >
                {t("common.apply")}
              </Button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

"use client";

import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Numbered pager — ‹ 1 2 3 … N › — used by every paginated table/list. */
export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  const t = useTranslations();
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <IconBtn label={t("common.previousPage")} disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>
        <Icon name="chevron-left" size={14} />
      </IconBtn>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="flex h-9 w-6 items-center justify-center text-xs text-text-quaternary">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors",
              p === page
                ? "bg-brand-600 text-white shadow-xs"
                : "text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary"
            )}
          >
            {p}
          </button>
        )
      )}
      <IconBtn label={t("common.nextPage")} disabled={page >= totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
        <Icon name="chevron-right" size={14} />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border-primary text-text-tertiary transition-colors hover:border-border-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

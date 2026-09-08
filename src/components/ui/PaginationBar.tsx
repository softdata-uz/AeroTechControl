"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { useTranslations } from "@/lib/locale-context";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * The full list-footer bar shared by every paginated table/list — page-size
 * picker + "showing X–Y of Z records" + numbered pager. Consolidates a
 * pattern that used to be hand-duplicated per page (Journal, Equipment,
 * Calibration, Documents, Faults, Users, …) so every list looks and behaves
 * identically, and a future visual tweak only needs to happen here.
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: PaginationBarProps) {
  const t = useTranslations();
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div
      className={
        "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-primary px-4 py-3 text-xs text-text-tertiary" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex items-center gap-2">
        <span>{t("common.showingPerPage")}</span>
        <Dropdown
          className="w-20"
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
        />
      </div>
      <div className="flex items-center gap-3">
        <span>
          {rangeStart}–{rangeEnd} {t("common.of")} {total} {t("common.records")}
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>
    </div>
  );
}

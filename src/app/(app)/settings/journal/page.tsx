"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks/useAsync";
import { journalService } from "@/services";
import type { JournalAction } from "@/services/journal.service";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const ACTIONS: JournalAction[] = ["login_success", "login_failed", "login_blocked", "create", "delete"];

const actionChipClass: Record<JournalAction, string> = {
  login_success: "bg-(--chip-success-bg) text-(--chip-success-text) border-(--chip-success-border)",
  login_failed: "bg-(--chip-warning-bg) text-(--chip-warning-text) border-(--chip-warning-border)",
  login_blocked: "bg-(--chip-error-bg) text-(--chip-error-text) border-(--chip-error-border)",
  create: "bg-(--chip-brand-bg) text-(--chip-brand-text) border-(--chip-brand-border)",
  delete: "bg-(--chip-error-bg) text-(--chip-error-text) border-(--chip-error-border)",
};

const actionLabelKey: Record<JournalAction, TranslationKey> = {
  login_success: "journal.action.login_success",
  login_failed: "journal.action.login_failed",
  login_blocked: "journal.action.login_blocked",
  create: "journal.action.create",
  delete: "journal.action.delete",
};

export default function JournalPage() {
  const t = useTranslations();
  const [actionFilter, setActionFilter] = useState<JournalAction | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, pageSize]);

  const filters = useMemo(
    () => ({ action: actionFilter || undefined, page, pageSize }),
    [actionFilter, page, pageSize]
  );

  const { data, loading, error, refetch } = useAsync(() => journalService.listJournal(filters), [filters]);
  const entries = data?.items ?? [];
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t("journal.title")} context={t("journal.context")} />

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-6 pt-5">
        <Dropdown
          className="w-56"
          placeholder={t("journal.filterAction")}
          value={actionFilter}
          onChange={(value) => setActionFilter(value as JournalAction | "")}
          options={ACTIONS.map((a) => ({ value: a, label: t(actionLabelKey[a]) }))}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          <div className="min-h-0 flex-1">
            {error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                <p className="text-sm text-text-secondary">{t("journal.loadError")}</p>
                <p className="text-xs text-text-tertiary">{error}</p>
                <Button hierarchy="secondary" size="sm" onClick={refetch}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
                {t("journal.loading")}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                <p className="text-sm text-text-secondary">{t("journal.notFound")}</p>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full min-w-[820px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-bg-secondary">
                    <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                      <th className="px-4 py-2.5">{t("journal.colTime")}</th>
                      <th className="px-4 py-2.5">{t("journal.colUser")}</th>
                      <th className="px-4 py-2.5">{t("journal.colAction")}</th>
                      <th className="px-4 py-2.5">{t("journal.colEntity")}</th>
                      <th className="px-4 py-2.5">{t("journal.colIp")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-text-secondary">
                          {formatDateTime(entry.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="truncate font-medium text-text-primary">
                            {entry.user?.fullName ?? entry.attemptedLogin ?? "—"}
                          </p>
                          {entry.user && (
                            <p className="truncate text-xs text-text-tertiary">{entry.user.login}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              actionChipClass[entry.action]
                            )}
                          >
                            {t(actionLabelKey[entry.action])}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">
                          {entry.entityType ? (
                            <>
                              <span className="capitalize">{entry.entityType}</span>
                              {entry.entityLabel && <span className="text-text-tertiary"> — {entry.entityLabel}</span>}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-text-tertiary">{entry.ipAddress ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-border-primary px-4 py-3 text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <span>{t("common.showingPerPage")}</span>
              <Dropdown
                className="w-20"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value))}
                options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <span>
                {rangeStart}–{rangeEnd} {t("common.of")} {total} {t("common.records")}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

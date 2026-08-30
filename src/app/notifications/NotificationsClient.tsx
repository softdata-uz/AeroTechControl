"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { useNotificationsList } from "@/hooks/useNotificationsList";
import { useAsync } from "@/hooks/useAsync";
import { notificationsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const severityMeta: Record<NotificationItem["severity"], { icon: IconName; className: string }> = {
  critical: { icon: "alert-triangle", className: "text-error-400" },
  warning: { icon: "clock", className: "text-warning-400" },
  info: { icon: "bell", className: "text-brand-400" },
};

const entityHref: Record<NotificationItem["entityType"], (id: string) => string> = {
  equipment: (id) => `/equipment/${id}`,
  fault: () => `/faults`,
  inspection: () => `/documents?tab=inspections`,
  spare_part: () => `/spare-parts`,
};

export function NotificationsClient() {
  const t = useTranslations();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  useEffect(() => setPage(1), [pageSize]);

  const { data, loading, error, refetch } = useNotificationsList({ page, pageSize });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [markingAll, setMarkingAll] = useState(false);

  // Unread count reflects the full notification set, independent of the current page.
  const { data: allNotificationsPage, refetch: refetchUnread } = useAsync(
    () => notificationsService.listNotifications({ pageSize: 1000 }),
    []
  );
  const unreadCount = (allNotificationsPage?.items ?? []).filter((n) => !n.read).length;

  async function markRead(id: string) {
    await notificationsService.markAsRead(id);
    await Promise.all([refetch(), refetchUnread()]);
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead();
      await Promise.all([refetch(), refetchUnread()]);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("notifications.title")}
        context={unreadCount > 0 ? `${t("notifications.unreadPrefix")} ${unreadCount}` : t("notifications.allRead")}
        actions={
          unreadCount > 0 ? (
            <Button hierarchy="secondary" icon="check-circle" size="sm" onClick={markAllRead} disabled={markingAll}>
              {markingAll ? t("notifications.markingAll") : t("notifications.markAllRead")}
            </Button>
          ) : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("notifications.loadError")}</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              {t("notifications.loading")}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-tertiary">
              <Icon name="bell" size={24} />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-secondary">
              {items.map((n) => {
                const meta = severityMeta[n.severity];
                return (
                  <li
                    key={n.id}
                    className={cn("flex items-start gap-3 px-4 py-3.5", !n.read && "bg-bg-tertiary/40")}
                  >
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    <Icon name={meta.icon} size={18} className={cn("mt-0.5 shrink-0", meta.className)} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={entityHref[n.entityType](n.entityId)}
                        onClick={() => markRead(n.id)}
                        className="text-sm font-medium text-text-primary hover:text-brand-400"
                      >
                        {n.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-tertiary">{n.description}</p>
                      <p className="mt-1 text-xs text-text-quaternary">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-brand-400 hover:bg-bg-quaternary"
                      >
                        {t("notifications.markRead")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
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

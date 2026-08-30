"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { useNotificationsList } from "@/hooks/useNotificationsList";
import { notificationsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

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
  const { data, loading, error, refetch } = useNotificationsList({ pageSize: 100 });
  const items = data?.items ?? [];
  const unreadCount = items.filter((n) => !n.read).length;
  const [markingAll, setMarkingAll] = useState(false);

  async function markRead(id: string) {
    await notificationsService.markAsRead(id);
    refetch();
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead();
      await refetch();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="pb-8">
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

      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
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
      </div>
    </div>
  );
}

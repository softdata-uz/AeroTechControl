"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CountBadge } from "@/components/ui/Badge";
import { primaryNav } from "@/config/nav.config";
import { roleNavAccess } from "@/config/roleAccess.config";
import { quickActionsFor } from "@/config/quickActions.config";
import { useRole } from "@/lib/role-context";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks/useAsync";
import { faultsService, notificationsService } from "@/services";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const t = useTranslations();
  const visibleNav = primaryNav.filter((item) => roleNavAccess[role].includes(item.href));

  const { data: totalFaults } = useAsync(
    () => faultsService.listFaults({ pageSize: 1 }),
    []
  );
  const { data: closedFaults } = useAsync(
    () => faultsService.listFaults({ stage: "closed", pageSize: 1 }),
    []
  );
  const openFaultsCount = (totalFaults?.total ?? 0) - (closedFaults?.total ?? 0);

  const { data: unreadNotificationsCount } = useAsync(
    () => notificationsService.getUnreadCount(),
    []
  );

  const badgeCounts: Record<string, number> = {
    openFaults: openFaultsCount,
    unreadNotifications: unreadNotificationsCount ?? 0,
  };
  const [openGroup, setOpenGroup] = useState<string | null>(
    primaryNav.find((i) => i.children?.some((c) => pathname.startsWith(c.href)))?.href ?? null
  );

  return (
    <aside
      data-force-theme="dark"
      className="flex h-screen w-64 shrink-0 flex-col border-r border-border-primary bg-bg-secondary"
    >
      <div className="flex h-[75px] shrink-0 items-center gap-2.5 border-b border-border-primary px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon name="shield" size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {t("sidebar.productName")}
          </p>
          <p className="truncate text-xs text-text-tertiary">
            {t("sidebar.productDescription")}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {visibleNav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const hasChildren = !!item.children?.length;
            const isOpen = openGroup === item.href;

            return (
              <li key={item.href}>
                <div
                  className={cn(
                    "flex h-10 items-center gap-0.5 rounded-md pr-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-600 text-white"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  <Link
                    href={item.href}
                    className="flex h-full min-w-0 flex-1 items-center gap-2.5 px-3"
                    onClick={() => hasChildren && setOpenGroup(isOpen ? null : item.href)}
                  >
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                    {item.badgeKey && badgeCounts[item.badgeKey] > 0 ? (
                      <CountBadge count={badgeCounts[item.badgeKey]} />
                    ) : null}
                  </Link>
                  {hasChildren && (
                    <button
                      aria-label={t("sidebar.expandSection")}
                      onClick={() => setOpenGroup(isOpen ? null : item.href)}
                      className="shrink-0 rounded p-1.5 opacity-70 transition-opacity hover:opacity-100"
                    >
                      <Icon
                        name="chevron-down"
                        size={14}
                        className={cn("transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                  )}
                </div>
                {hasChildren && isOpen && (
                  <ul className="ml-8 mt-0.5 space-y-0.5 border-l border-border-primary pl-3">
                    {item.children!.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            "block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            pathname === child.href
                              ? "text-brand-400"
                              : "text-text-tertiary hover:text-text-primary"
                          )}
                        >
                          {t(child.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-primary p-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-quaternary">
          {t("sidebar.quickActions")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {quickActionsFor(pathname).map((qa) => (
            <QuickAction key={qa.labelKey} icon={qa.icon} href={qa.href} label={t(qa.labelKey)} />
          ))}
        </div>
        <p className="mt-3 px-1 text-xs text-text-quaternary">{t("sidebar.footer")}</p>
      </div>
    </aside>
  );
}

function QuickAction({ icon, href, label }: { icon: IconName; href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-2 py-2.5 text-center text-xs font-medium text-text-tertiary transition-colors hover:border-brand-600 hover:text-text-primary"
    >
      <Icon name={icon} size={16} />
      <span className="leading-tight">{label}</span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CountBadge } from "@/components/ui/Badge";
import { primaryNav } from "@/config/nav.config";
import { roleNavAccess } from "@/config/roleAccess.config";
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      data-force-theme="dark"
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border-primary bg-bg-secondary transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-[75px] shrink-0 items-center border-b border-border-primary",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {!collapsed && <img src="/airport-emblem-gold.png" alt="" className="h-10 w-10 shrink-0" />}
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#CEA53C" }}>
              Uzbekistan
            </p>
            <p className="truncate text-base font-bold text-text-primary">Airports</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
          title={t(collapsed ? "sidebar.expand" : "sidebar.collapse")}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-quaternary transition-colors hover:bg-bg-tertiary hover:text-text-primary",
            !collapsed && "ml-auto"
          )}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={16} />
        </button>
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
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={cn(
                      "flex h-full min-w-0 flex-1 items-center gap-2.5",
                      collapsed ? "justify-center px-0" : "px-3"
                    )}
                    onClick={() => hasChildren && setOpenGroup(isOpen ? null : item.href)}
                  >
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>}
                    {!collapsed && item.badgeKey && badgeCounts[item.badgeKey] > 0 ? (
                      <CountBadge count={badgeCounts[item.badgeKey]} />
                    ) : null}
                  </Link>
                  {!collapsed && hasChildren && (
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
                {!collapsed && hasChildren && isOpen && (
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

      {!collapsed && (
        <div className="border-t border-border-primary p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/soft-data-logo.png" alt="" className="mx-auto h-auto w-full max-w-[180px]" />
          <p className="mt-3 px-1 text-center text-xs text-text-quaternary">{t("sidebar.footer")}</p>
        </div>
      )}
    </aside>
  );
}

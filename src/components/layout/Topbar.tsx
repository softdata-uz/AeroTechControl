"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { CountBadge } from "@/components/ui/Badge";
import { LanguageMenu } from "./LanguageMenu";
import { notifications } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { useTheme } from "@/lib/theme-context";
import { useTranslations } from "@/lib/locale-context";
import { roleLabelKeys } from "@/config/roleAccess.config";

export function Topbar() {
  const { user } = useRole();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="flex h-[75px] shrink-0 items-center justify-between border-b border-border-primary bg-bg-secondary px-6">
      <div />
      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          aria-label={t("topbar.notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name="bell" size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1">
              <CountBadge count={unreadCount} />
            </span>
          )}
        </Link>
        <button
          aria-label={t("topbar.help")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name="help-circle" size={20} />
        </button>
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t("topbar.enableLightTheme") : t("topbar.enableDarkTheme")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
        </button>
        <LanguageMenu />
        <div className="h-6 w-px bg-border-primary" />
        <Link
          href="/settings"
          className="flex h-10 items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors hover:bg-bg-tertiary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-text-primary">{user.fullName}</p>
            <p className="text-xs leading-tight text-text-tertiary">{t(roleLabelKeys[user.role])}</p>
          </div>
          <Icon name="chevron-down" size={14} className="text-text-quaternary" />
        </Link>
      </div>
    </header>
  );
}

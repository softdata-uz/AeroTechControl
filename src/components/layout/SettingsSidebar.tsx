"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/cn";

const items: { href: string; icon: IconName; labelKey: TranslationKey }[] = [
  { href: "/settings/locations", icon: "map-pin", labelKey: "settingsCrud.locationsPageTitle" },
  { href: "/settings/equipment", icon: "cpu", labelKey: "settingsCrud.equipmentPageTitle" },
  { href: "/settings/manufacturers", icon: "building", labelKey: "settingsCrud.manufacturersPageTitle" },
];

/** Settings-only sub-navigation, distinct from the main app Sidebar — lists the admin CRUD sections. */
export function SettingsSidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border-primary bg-bg-secondary">
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-600 text-white"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  <Icon name={item.icon} size={18} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

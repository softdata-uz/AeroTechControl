"use client";

import { useTranslations } from "@/lib/locale-context";

/** Full-width footer bar under the main content area — every page. */
export function Footer() {
  const t = useTranslations();
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-border-primary bg-bg-secondary px-6 py-3 text-xs text-text-quaternary">
      <span>{t("footer.copyright")}</span>
      <span>{t("footer.version")}</span>
    </footer>
  );
}

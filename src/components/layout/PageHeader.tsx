import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";

interface PageHeaderProps {
  title: string;
  context?: string;
  actions?: ReactNode;
  /** Present only on pages pushed on top of a known parent route (detail/edit/new) — renders a leading back icon-button. */
  onBack?: () => void;
}

export function PageHeader({ title, context, actions, onBack }: PageHeaderProps) {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("common.back")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-quaternary transition-colors hover:bg-bg-quaternary hover:text-text-primary"
          >
            <Icon name="chevron-left" size={18} />
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          {context && <p className="mt-0.5 text-xs text-text-tertiary">{context}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

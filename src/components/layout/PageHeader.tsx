import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  context?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, context, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {context && <p className="mt-0.5 text-xs text-text-tertiary">{context}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

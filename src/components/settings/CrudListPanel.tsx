"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Icon } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";

export interface CrudListItem {
  id: number | string;
  primary: string;
  secondary?: string;
}

interface Props {
  title: string;
  items: CrudListItem[];
  loading?: boolean;
  addLabel: string;
  onAdd: () => void;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}

/**
 * Compact scrollable list panel — title header, rows with inline
 * edit-pencil + delete-trash icon buttons (no checkboxes), and a
 * full-width "+ Add …" button pinned at the bottom. Reused for every
 * entity managed under Settings (Users, Airports, Terminals, Zones, the
 * five Equipment lookups) so all 8 panels share one implementation.
 */
export function CrudListPanel({ title, items, loading, addLabel, onAdd, onEdit, onDelete }: Props) {
  const t = useTranslations();
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-text-quaternary">{items.length}</span>
      </CardHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-6 text-sm text-text-tertiary">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-tertiary">{t("settingsCrud.empty")}</p>
        ) : (
          <ul className="divide-y divide-border-secondary">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{item.primary}</p>
                  {item.secondary && (
                    <p className="truncate text-xs text-text-tertiary">{item.secondary}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    aria-label={t("common.edit")}
                    onClick={() => onEdit(item.id)}
                    className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-brand-400"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    aria-label={t("common.delete")}
                    onClick={() => onDelete(item.id)}
                    className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-error-400"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onAdd}
        className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border-secondary bg-brand-600/10 px-4 py-3 text-sm font-medium text-brand-400 transition-colors hover:bg-brand-600/20"
      >
        <Icon name="plus" size={16} />
        {addLabel}
      </button>
    </Card>
  );
}

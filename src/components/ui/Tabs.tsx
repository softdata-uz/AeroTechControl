import { cn } from "@/lib/cn";

interface TabItem<K extends string> {
  key: K;
  label: string;
  badge?: number;
}

interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}

/**
 * Underline tabs — Figma "_Tab button base" → Type=Underline, Current=True
 * (18666:66814): the active tab is distinguished by THREE cues at once
 * (border, weight, color), not color alone, so it stays obvious at a
 * glance instead of blending into the inactive row.
 */
export function Tabs<K extends string>({ items, value, onChange, className }: TabsProps<K>) {
  return (
    <div role="tablist" className={cn("flex gap-1 border-b border-border-primary", className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm transition-colors",
              active
                ? "border-brand-500 font-semibold text-(--chip-brand-text)"
                : "border-transparent font-medium text-text-tertiary hover:border-border-secondary hover:text-text-secondary"
            )}
          >
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span
                className={cn(
                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-(--chip-brand-bg) text-(--chip-brand-text)" : "bg-(--chip-gray-bg) text-(--chip-gray-text)"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

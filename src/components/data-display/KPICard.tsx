import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "error" | "brand" | "purple";

interface KPICardProps {
  label: string;
  value: string | number;
  meta?: string;
  icon: IconName;
  tone?: Tone;
}

const toneStyles: Record<Tone, { icon: string; ring: string }> = {
  neutral: { icon: "bg-(--chip-gray-bg) text-(--chip-gray-text)", ring: "border-border-primary" },
  success: { icon: "bg-(--chip-success-bg) text-(--chip-success-text)", ring: "border-(--chip-success-border)" },
  warning: { icon: "bg-(--chip-warning-bg) text-(--chip-warning-text)", ring: "border-(--chip-warning-border)" },
  error: { icon: "bg-(--chip-error-bg) text-(--chip-error-text)", ring: "border-(--chip-error-border)" },
  brand: { icon: "bg-(--chip-brand-bg) text-(--chip-brand-text)", ring: "border-(--chip-brand-border)" },
  purple: { icon: "bg-(--chip-purple-bg) text-(--chip-purple-text)", ring: "border-(--chip-purple-border)" },
};

export function KPICard({ label, value, meta, icon, tone = "neutral" }: KPICardProps) {
  const t = toneStyles[tone];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-bg-secondary p-4", t.ring)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", t.icon)}>
        <Icon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-text-tertiary">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-text-primary">{value}</span>
          {meta && <span className="text-xs text-text-quaternary">{meta}</span>}
        </div>
      </div>
    </div>
  );
}

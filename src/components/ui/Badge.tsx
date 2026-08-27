import { cn } from "@/lib/cn";
import type { StatusVisual } from "@/config/equipmentStatus.config";

export function StatusBadge({ status, className }: { status: StatusVisual; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium",
        status.badgeBg,
        status.badgeText,
        status.badgeBorder,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
      {status.label}
    </span>
  );
}

export function CountBadge({ count, tone = "error" }: { count: number; tone?: "error" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
        tone === "error" ? "bg-error-600" : "bg-brand-600"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

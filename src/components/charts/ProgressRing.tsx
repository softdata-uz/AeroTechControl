"use client";

import { motion } from "framer-motion";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { cn } from "@/lib/cn";

interface ProgressRingProps {
  label: string;
  value: number;
  max?: number;
  /** Explicit percentage (0-100) — overrides the value/max computation when given. */
  pct?: number;
  /** Track/arc color — a resolved color, a `var(--x)` token, or one of the
   * fixed categorical colors via index. Defaults to the brand color. */
  color?: string;
  size?: number;
  formatValue?: (v: number) => string;
  className?: string;
}

/** Small animated circular progress indicator — label above, value below,
 * colored arc drawn in over a muted track (Framer Motion `stroke-dashoffset`
 * tween, since this animates outside any chart library's own render). */
export function ProgressRing({
  label,
  value,
  max = 100,
  pct,
  color,
  size = 96,
  formatValue = (v) => String(v),
  className,
}: ProgressRingProps) {
  const { tokens, resolveColor } = useChartTokens();
  const percent = Math.max(0, Math.min(100, pct ?? (max > 0 ? (value / max) * 100 : 0)));
  const arcColor = resolveColor(color ?? categoricalColor(0));

  const strokeWidth = Math.max(4, Math.round(size * 0.08));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-xs text-text-tertiary">{label}</span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tokens["--border-secondary"]}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-primary">
          {formatValue(value)}
        </div>
      </div>
    </div>
  );
}

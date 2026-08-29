"use client";

import { motion } from "framer-motion";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/cn";

export interface RankedBarDatum {
  label: string;
  value: number;
  color?: string;
}

interface RankedBarListProps {
  data: RankedBarDatum[];
  formatValue?: (v: number) => string;
  className?: string;
}

/** Compact ranked list — colored swatch + label + count-up number + a
 * proportion bar that animates its width in, sized relative to the
 * largest value in the set. Denser than a small column chart, so it fits
 * more rows in the same card height. */
export function RankedBarList({ data, formatValue = (v) => String(Math.round(v)), className }: RankedBarListProps) {
  const { resolveColor } = useChartTokens();
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);

  return (
    <ul className={cn("flex h-full flex-col justify-evenly gap-3", className)}>
      {data.map((d, i) => {
        const pctWidth = max ? (d.value / max) * 100 : 0;
        const color = resolveColor(d.color ?? categoricalColor(i));
        return (
          <li key={d.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-sm text-text-secondary">{d.label}</span>
              </div>
              <AnimatedNumber
                value={d.value}
                formatValue={formatValue}
                className="shrink-0 text-sm font-semibold text-text-primary"
              />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pctWidth}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

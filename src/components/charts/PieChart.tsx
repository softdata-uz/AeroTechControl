"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { cn } from "@/lib/cn";

export interface PieDatum {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieDatum[];
  size?: number;
  formatValue?: (v: number) => string;
  centerLabel?: string;
  /** Caption shown above the center total. */
  totalLabel?: string;
  className?: string;
}

/** Animated donut (Recharts) — hover tooltip with value + share, legend
 * to the side, animated count-up center total. */
export function PieChart({
  data,
  size = 200,
  formatValue = (v) => String(v),
  centerLabel,
  totalLabel = "Total",
  className,
}: PieChartProps) {
  const { tokens, resolveColor } = useChartTokens();
  const total = data.reduce((s, d) => s + d.value, 0);
  const centerValue = centerLabel ?? String(total);
  const centerNumeric = Number(centerValue.replace(/[^\d.-]/g, ""));
  const animateCenter = centerValue !== "" && !Number.isNaN(centerNumeric) && String(centerNumeric) === centerValue;
  const [displayValue, setDisplayValue] = useState(animateCenter ? 0 : centerNumeric);

  useEffect(() => {
    if (!animateCenter) return;
    const start = performance.now();
    const duration = 600;
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(centerNumeric * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerNumeric, animateCenter]);

  return (
    <div className={cn("flex w-full items-center gap-4", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: size, height: size }}>
          <RePieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="66%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke={tokens["--bg-secondary"]}
              strokeWidth={2}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={resolveColor(d.color ?? categoricalColor(i))} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              contentStyle={{
                background: tokens["--bg-tertiary"],
                border: `1px solid ${tokens["--border-primary"]}`,
                borderRadius: 8,
                color: tokens["--text-primary"],
                fontSize: 13,
              }}
              labelStyle={{ color: tokens["--text-secondary"] }}
            />
          </RePieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-text-tertiary">{totalLabel}</span>
          <motion.span
            className="text-xl font-semibold text-text-primary"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {animateCenter ? displayValue : centerValue}
          </motion.span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
        {data.map((d, i) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={d.label} className="flex items-center gap-2 text-xs text-text-secondary">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: resolveColor(d.color ?? categoricalColor(i)) }}
              />
              <span className="truncate">
                {d.label}: {formatValue(d.value)} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

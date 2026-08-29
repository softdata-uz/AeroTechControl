"use client";

import {
  BarChart as ReBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { cn } from "@/lib/cn";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  /** Fixed pixel height, or "100%" to fill a sized flex/grid parent. */
  height?: number | string;
  formatValue?: (v: number) => string;
  /** Series name shown in the hover tooltip — pass a translated string. */
  seriesName?: string;
  className?: string;
}

/** Animated column chart (Recharts) — real hover tooltips, entrance
 * animation, per-bar color. */
export function BarChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  seriesName = "Value",
  className,
}: BarChartProps) {
  const { tokens, resolveColor } = useChartTokens();
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: typeof height === "number" ? height : 220 }}>
        <ReBarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={tokens["--border-secondary"]} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: tokens["--text-quaternary"], fontSize: 12 }}
            interval={0}
          />
          <YAxis hide domain={[0, max * 1.25 || "auto"]} />
          <Tooltip
            cursor={{ fill: tokens["--bg-tertiary"], opacity: 0.5 }}
            formatter={(value) => [formatValue(Number(value)), seriesName]}
            contentStyle={{
              background: tokens["--bg-tertiary"],
              border: `1px solid ${tokens["--border-primary"]}`,
              borderRadius: 8,
              color: tokens["--text-primary"],
              fontSize: 13,
            }}
            labelStyle={{ color: tokens["--text-secondary"] }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.label} fill={resolveColor(d.color ?? categoricalColor(i))} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value) => formatValue(Number(value))}
              style={{ fill: tokens["--text-secondary"], fontSize: 13, fontWeight: 500 }}
            />
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

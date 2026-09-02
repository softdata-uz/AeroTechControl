"use client";

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { cn } from "@/lib/cn";

export interface LineSeries {
  name: string;
  color?: string;
  points: { label: string; value: number }[];
}

interface LineChartProps {
  series: LineSeries[];
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}

/** Animated line chart (Recharts) — smooth draw-in, hover crosshair +
 * tooltip, marker on point hover. */
export function LineChart({ series, height = 220, formatValue = (v) => String(v), className }: LineChartProps) {
  const { tokens, resolveColor } = useChartTokens();
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    series.forEach((s) => {
      row[s.name] = s.points[i]?.value ?? 0;
    });
    return row;
  });

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height }}>
        <ReLineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={tokens["--border-secondary"]} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: tokens["--text-quaternary"], fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: tokens["--text-quaternary"], fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <Tooltip
            cursor={{ stroke: tokens["--border-primary"], strokeWidth: 1 }}
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
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 13, color: tokens["--text-tertiary"] }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, i) => {
            const color = resolveColor(s.color ?? categoricalColor(i));
            return (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 0, fill: color }}
                activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                isAnimationActive
                animationDuration={500}
                animationEasing="ease-out"
              />
            );
          })}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

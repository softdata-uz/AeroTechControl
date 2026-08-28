"use client";

import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartTokens } from "./useChartTokens";
import { categoricalColor } from "./palette";
import { cn } from "@/lib/cn";

export interface RadarSeries {
  name: string;
  color?: string;
  values: number[]; // aligned with `axes`, same length
}

interface RadarChartProps {
  axes: string[];
  series: RadarSeries[];
  max?: number;
  size?: number;
  className?: string;
}

/** Animated radar/spider chart (Recharts) — hover tooltip per axis,
 * animated polygon draw-in. */
export function RadarChart({ axes, series, max, size = 240, className }: RadarChartProps) {
  const { tokens, resolveColor } = useChartTokens();

  const data = axes.map((axis, i) => {
    const row: Record<string, string | number> = { axis };
    series.forEach((s) => {
      row[s.name] = s.values[i] ?? 0;
    });
    return row;
  });

  return (
    <div className={cn("flex w-full justify-center", className)} style={{ height: size }}>
      <ResponsiveContainer width={size} height="100%" initialDimension={{ width: size, height: size }}>
        <ReRadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={tokens["--border-secondary"]} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: tokens["--text-quaternary"], fontSize: 12 }} />
          <PolarRadiusAxis domain={max != null ? [0, max] : undefined} tick={false} axisLine={false} />
          <Tooltip
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
              <Radar
                key={s.name}
                name={s.name}
                dataKey={s.name}
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: color }}
                isAnimationActive
                animationDuration={500}
                animationEasing="ease-out"
              />
            );
          })}
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

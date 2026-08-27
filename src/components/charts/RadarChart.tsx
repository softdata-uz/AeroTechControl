"use client";

import ApexChart from "./ApexChart";
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

/** Animated radar/spider chart (ApexCharts native radar type) — hover
 * tooltip per axis, animated polygon draw-in. */
export function RadarChart({ axes, series, max, size = 240, className }: RadarChartProps) {
  const { tokens, apexTheme } = useChartTokens();

  const options = {
    chart: {
      type: "radar" as const,
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeout" as const, speed: 500 },
      foreColor: tokens["--text-tertiary"],
      fontFamily: "inherit",
    },
    theme: { mode: apexTheme },
    xaxis: {
      categories: axes,
      labels: { style: { colors: axes.map(() => tokens["--text-quaternary"]), fontSize: "12px" } },
    },
    yaxis: { show: false, max },
    colors: series.map((s, i) => s.color ?? categoricalColor(i)),
    markers: { size: 3, strokeWidth: 0 },
    stroke: { width: 2 },
    fill: { opacity: 0.15 },
    legend: {
      show: series.length > 1,
      position: "bottom" as const,
      labels: { colors: tokens["--text-tertiary"] },
      fontSize: "13px",
      markers: { size: 5 },
    },
    tooltip: { theme: apexTheme },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: tokens["--border-secondary"],
          connectorColors: tokens["--border-secondary"],
        },
      },
    },
  };

  const apexSeries = series.map((s) => ({ name: s.name, data: s.values }));

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <ApexChart options={options} series={apexSeries} type="radar" height={size} width={size} />
    </div>
  );
}

"use client";

import ApexChart from "./ApexChart";
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

/** Animated line chart (ApexCharts) — smooth draw-in, hover crosshair +
 * tooltip, marker on point hover. */
export function LineChart({ series, height = 220, formatValue = (v) => String(v), className }: LineChartProps) {
  const { tokens, apexTheme } = useChartTokens();
  const labels = series[0]?.points.map((p) => p.label) ?? [];

  const options = {
    chart: {
      type: "line" as const,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: "easeout" as const, speed: 500 },
      foreColor: tokens["--text-tertiary"],
      fontFamily: "inherit",
    },
    theme: { mode: apexTheme },
    stroke: { curve: "smooth" as const, width: 2 },
    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
    colors: series.map((s, i) => s.color ?? categoricalColor(i)),
    xaxis: {
      categories: labels,
      labels: { style: { colors: tokens["--text-quaternary"], fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: tokens["--text-quaternary"], fontSize: "12px" } },
    },
    grid: {
      borderColor: tokens["--border-secondary"],
      strokeDashArray: 3,
      padding: { left: 8, right: 8 },
    },
    legend: {
      show: series.length > 1,
      labels: { colors: tokens["--text-tertiary"] },
      fontSize: "13px",
      markers: { size: 5 },
    },
    tooltip: {
      theme: apexTheme,
      y: { formatter: (v: number) => formatValue(v) },
    },
  };

  const apexSeries = series.map((s) => ({ name: s.name, data: s.points.map((p) => p.value) }));

  return (
    <div className={cn("w-full", className)}>
      <ApexChart options={options} series={apexSeries} type="line" height={height} width="100%" />
    </div>
  );
}

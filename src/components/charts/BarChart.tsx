"use client";

import ApexChart from "./ApexChart";
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
  height?: number;
  formatValue?: (v: number) => string;
  /** Series name shown in the hover tooltip — pass a translated string. */
  seriesName?: string;
  className?: string;
}

/** Animated column chart (ApexCharts) — real hover tooltips, entrance
 * animation, per-bar color via `distributed` columns. */
export function BarChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  seriesName = "Value",
  className,
}: BarChartProps) {
  const { tokens, apexTheme } = useChartTokens();

  const options = {
    chart: {
      type: "bar" as const,
      toolbar: { show: false },
      animations: { enabled: true, easing: "easeout" as const, speed: 500 },
      foreColor: tokens["--text-tertiary"],
      fontFamily: "inherit",
    },
    theme: { mode: apexTheme },
    plotOptions: {
      bar: { borderRadius: 4, borderRadiusApplication: "end" as const, columnWidth: "55%", distributed: true },
    },
    dataLabels: {
      enabled: true,
      style: { colors: [tokens["--text-secondary"]], fontSize: "13px", fontWeight: 500 },
      offsetY: -20,
      formatter: (v: number) => formatValue(v),
    },
    xaxis: {
      categories: data.map((d) => d.label),
      labels: { style: { colors: tokens["--text-quaternary"], fontSize: "12px" }, trim: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: false }, max: (max: number) => max * 1.25 },
    grid: {
      borderColor: tokens["--border-secondary"],
      strokeDashArray: 3,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      padding: { left: 8, right: 8 },
    },
    colors: data.map((d, i) => d.color ?? categoricalColor(i)),
    legend: { show: false },
    tooltip: {
      theme: apexTheme,
      y: { formatter: (v: number) => formatValue(v) },
    },
  };

  const series = [{ name: seriesName, data: data.map((d) => d.value) }];

  return (
    <div className={cn("w-full [&_.apexcharts-tooltip]:!shadow-lg", className)}>
      <ApexChart options={options} series={series} type="bar" height={height} width="100%" />
    </div>
  );
}

"use client";

import ApexChart from "./ApexChart";
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
  className?: string;
}

/** Animated donut (ApexCharts) — hover tooltip with value + share, legend
 * to the side, animated center total. */
export function PieChart({ data, size = 200, formatValue = (v) => String(v), centerLabel, className }: PieChartProps) {
  const { tokens, apexTheme } = useChartTokens();
  const total = data.reduce((s, d) => s + d.value, 0);

  const options = {
    chart: {
      type: "donut" as const,
      animations: { enabled: true, easing: "easeout" as const, speed: 500 },
      foreColor: tokens["--text-tertiary"],
      fontFamily: "inherit",
    },
    theme: { mode: apexTheme },
    labels: data.map((d) => d.label),
    colors: data.map((d, i) => d.color ?? categoricalColor(i)),
    stroke: { width: 2, colors: [tokens["--bg-secondary"]] },
    dataLabels: { enabled: false },
    legend: {
      position: "right" as const,
      fontSize: "13px",
      labels: { colors: tokens["--text-secondary"] },
      markers: { size: 5 },
      itemMargin: { vertical: 3 },
      formatter: (label: string, opts?: { seriesIndex: number; w: { globals: { series: number[] } } }) => {
        if (!opts) return label;
        const value = opts.w.globals.series[opts.seriesIndex];
        const pct = total ? Math.round((value / total) * 100) : 0;
        return `${label}: ${formatValue(value)} (${pct}%)`;
      },
    },
    tooltip: {
      theme: apexTheme,
      y: { formatter: (v: number) => formatValue(v) },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Всего",
              color: tokens["--text-primary"],
              formatter: () => centerLabel ?? String(total),
            },
            value: { color: tokens["--text-primary"], fontSize: "20px", fontWeight: 600 },
          },
        },
      },
    },
  };

  const series = data.map((d) => d.value);

  return (
    <div className={cn("w-full", className)}>
      <ApexChart options={options} series={series} type="donut" height={size} />
    </div>
  );
}

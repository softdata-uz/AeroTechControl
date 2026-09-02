"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LineChart } from "@/components/charts/LineChart";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { faultPriorityChartColor } from "@/config/faultStatus.config";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";
import type { FaultTrendPoint } from "@/services/fault-intelligence.service";

interface FaultTrendChartProps {
  trend: FaultTrendPoint[];
  loading?: boolean;
}

/** Total / Critical / Resolved daily fault volume — shared by the Dashboard
 * Fault Intelligence block and the Faults page's "charts" tab. */
export function FaultTrendChart({ trend, loading }: FaultTrendChartProps) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("faultIntel.trendTitle")}</CardTitle>
      </CardHeader>
      <div className="p-4">
        <ChartFrame loading={loading} isEmpty={trend.length === 0} emptyLabel={t("faultIntel.noData")} height={220}>
          <LineChart
            height={220}
            formatValue={(v) => String(Math.round(v))}
            series={[
              {
                name: t("faultIntel.trendTotal"),
                color: "var(--color-gray-400)",
                points: trend.map((p) => ({ label: formatDate(p.date).slice(0, 5), value: p.total })),
              },
              {
                name: t("faultIntel.trendCritical"),
                color: faultPriorityChartColor.critical,
                points: trend.map((p) => ({ label: formatDate(p.date).slice(0, 5), value: p.critical })),
              },
              {
                name: t("faultIntel.trendResolved"),
                color: "var(--color-success-500)",
                points: trend.map((p) => ({ label: formatDate(p.date).slice(0, 5), value: p.resolved })),
              },
            ]}
          />
        </ChartFrame>
      </div>
    </Card>
  );
}

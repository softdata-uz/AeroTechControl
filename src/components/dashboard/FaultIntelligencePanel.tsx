"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { KPICard } from "@/components/data-display/KPICard";
import { PieChart } from "@/components/charts/PieChart";
import { RankedBarList } from "@/components/charts/RankedBarList";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { categoricalColor } from "@/components/charts/palette";
import { getFaultPriorityConfig, faultPriorityChartColor } from "@/config/faultStatus.config";
import { formatHours } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";
import type { FaultIntelligenceSummary } from "@/services/fault-intelligence.service";

interface FaultIntelligencePanelProps {
  summary: FaultIntelligenceSummary | null;
  loading: boolean;
  error: string | null;
}

/** KPI row + category/severity breakdown — shared by the Dashboard Fault
 * Intelligence block and the Faults page's "charts" tab. */
export function FaultIntelligencePanel({ summary, loading, error }: FaultIntelligencePanelProps) {
  const t = useTranslations();
  const priorityConfig = getFaultPriorityConfig(t);

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border-primary bg-bg-secondary px-4 py-10 text-sm text-text-tertiary">
        {error}
      </div>
    );
  }

  const kpis = summary?.kpis;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label={t("faultIntel.openFaults")}
          value={loading || !kpis ? "—" : kpis.openFaults}
          icon="alert-triangle"
          tone="warning"
        />
        <KPICard
          label={t("faultIntel.criticalFaults")}
          value={loading || !kpis ? "—" : kpis.criticalFaults}
          icon="alert-triangle"
          tone="error"
        />
        <KPICard
          label={t("faultIntel.avgResolutionTime")}
          value={loading || !kpis ? "—" : formatHours(kpis.avgResolutionHours)}
          meta={loading || !kpis ? undefined : `${kpis.avgResolutionSampleSize} ${t("faultIntel.repairsSuffix")}`}
          icon="clock"
          tone="brand"
        />
        <KPICard
          label={t("faultIntel.repeatFaultRate")}
          value={loading || !kpis ? "—" : `${kpis.repeatFaultRatePct}%`}
          icon="refresh"
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("faultIntel.byCategory")}</CardTitle>
          </CardHeader>
          <div className="flex flex-1 items-center justify-center p-4">
            <ChartFrame loading={loading} isEmpty={!summary || summary.byCategory.length === 0} emptyLabel={t("faultIntel.noData")} height={200}>
              <PieChart
                size={180}
                centerLabel={summary ? String(summary.byCategory.reduce((s, c) => s + c.count, 0)) : "0"}
                totalLabel={t("common.total")}
                data={(summary?.byCategory ?? []).map((c, i) => ({
                  label: c.category,
                  value: c.count,
                  color: categoricalColor(i),
                }))}
              />
            </ChartFrame>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("faultIntel.bySeverity")}</CardTitle>
          </CardHeader>
          <div className="flex-1 p-4">
            <ChartFrame loading={loading} isEmpty={!summary || summary.bySeverity.length === 0} emptyLabel={t("faultIntel.noData")} height={200}>
              <RankedBarList
                data={(summary?.bySeverity ?? []).map((s) => ({
                  label: priorityConfig[s.priority].label,
                  value: s.count,
                  color: faultPriorityChartColor[s.priority],
                }))}
              />
            </ChartFrame>
          </div>
        </Card>
      </div>
    </div>
  );
}

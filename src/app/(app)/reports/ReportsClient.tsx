"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/data-display/KPICard";
import { PeriodSelect } from "./PeriodSelect";
import { LineChart } from "@/components/charts/LineChart";
import { RadarChart } from "@/components/charts/RadarChart";
import { RankedBarList } from "@/components/charts/RankedBarList";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { categoricalColor } from "@/components/charts/palette";
import { formatDate, formatHours } from "@/lib/format";
import { useReportsSummary } from "@/hooks/useReportsSummary";
import { reportsService } from "@/services";
import type { ReportPeriod } from "@/services/reports.service";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const periodLabelKeys: Record<ReportPeriod, TranslationKey> = {
  "30d": "reports.period30d",
  "90d": "reports.period90d",
  year: "reports.periodYear",
};

export function ReportsClient() {
  const t = useTranslations();
  const [period, setPeriod] = useState<ReportPeriod>("30d");
  const { data: summary, loading, error, refetch } = useReportsSummary(period);

  return (
    <div className="pb-8">
      <PageHeader
        title={t("reports.title")}
        context={t(periodLabelKeys[period])}
        actions={
          <>
            <PeriodSelect value={period} onChange={setPeriod} />
            <Button hierarchy="secondary" icon="download" size="sm">
              {t("common.export")}
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mx-6 mt-5 flex flex-col items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary px-4 py-16 text-center">
          <p className="text-sm text-text-secondary">{t("reports.loadError")}</p>
          <p className="text-xs text-text-tertiary">{error}</p>
          <Button hierarchy="secondary" size="sm" onClick={refetch}>
            {t("common.retry")}
          </Button>
        </div>
      ) : loading || !summary ? (
        <div className="mx-6 mt-5 flex items-center justify-center rounded-xl border border-border-primary bg-bg-secondary px-4 py-16 text-sm text-text-tertiary">
          {t("reports.loading")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-3 xl:grid-cols-6">
            <KPICard label={t("reports.metricTotalEquipment")} value={summary.total} icon="cpu" tone="neutral" />
            <KPICard label={t("reports.metricOperational")} value={summary.operational} icon="check-circle" tone="success" />
            <KPICard label={t("reports.metricFaulty")} value={summary.faulty} icon="alert-triangle" tone="error" />
            <KPICard label={t("reports.metricUnderRepair")} value={summary.underRepair} icon="wrench" tone="warning" />
            <KPICard label={t("reports.metricOverdueInspections")} value={summary.overdueInspections} icon="clock" tone="error" />
            <KPICard label={t("reports.metricUpcomingInspections")} value={summary.upcomingInspections} icon="calendar-date" tone="brand" />
          </div>

          <div className="px-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.complianceByAirport")}</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[720px] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-secondary text-text-quaternary">
                      <th className="sticky left-0 bg-bg-secondary px-2 py-2 text-left font-medium">
                        {t("reports.complianceAirportColumn")}
                      </th>
                      {summary.complianceMatrix.types.map((type) => (
                        <th key={type} title={type} className="px-2 py-2 text-center font-medium">
                          <span className="mx-auto block max-w-[100px] truncate">{type}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.complianceMatrix.rows.map(({ airport, cells }) => (
                      <tr key={airport.id} className="border-b border-border-secondary last:border-0">
                        <td className="sticky left-0 whitespace-nowrap bg-bg-secondary px-2 py-2 font-medium text-text-secondary">
                          {airport.city}
                        </td>
                        {cells.map((cell, i) => (
                          <td key={i} className="px-2 py-2 text-center">
                            {cell ? (
                              <span
                                title={`${cell.count} ${t("units.count")}`}
                                className={
                                  cell.pct >= 90
                                    ? "font-medium text-success-400"
                                    : "font-medium text-warning-400"
                                }
                              >
                                {cell.pct}%
                              </span>
                            ) : (
                              <span title={t("reports.complianceNoData")} className="text-text-quaternary">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="px-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.faultsDynamics")}</CardTitle>
              </CardHeader>
              <div className="p-4">
                <ChartFrame height={160} isEmpty={summary.dailyFaults.length === 0} emptyLabel={t("reports.noFaultsInPeriod")}>
                  <LineChart
                    height={160}
                    formatValue={(v) => String(Math.round(v))}
                    series={[
                      {
                        name: t("dashboard.faults"),
                        color: "var(--color-error-400)",
                        points: summary.dailyFaults.map((d) => ({
                          label: formatDate(d.date).slice(0, 5),
                          value: d.value,
                        })),
                      },
                    ]}
                  />
                </ChartFrame>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 px-6 pt-4 sm:grid-cols-2">
            <KPICard
              label={t("reports.mttrTitle")}
              value={formatHours(summary.mttrHours)}
              meta={`${t("reports.mttrCalculatedOn")} ${summary.mttrSampleSize} ${t("reports.mttrCompletedRepairs")}`}
              icon="clock"
              tone="warning"
            />
            <KPICard
              label={t("reports.mtbfTitle")}
              value={formatHours(summary.mtbfHours)}
              meta={`${t("reports.mtbfEstimateOn")} ${summary.total} ${t("reports.mtbfUnits")}`}
              icon="gauge"
              tone="brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.problemTypesTitle")}</CardTitle>
              </CardHeader>
              <div className="p-4">
                <ChartFrame isEmpty={summary.byTypeFaultCount.length === 0} emptyLabel={t("reports.noFaultsInPeriod")} height={180}>
                  <RankedBarList
                    data={summary.byTypeFaultCount.map(([label, value], i) => ({
                      label,
                      value,
                      color: categoricalColor(i),
                    }))}
                  />
                </ChartFrame>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.airportComparison")}</CardTitle>
              </CardHeader>
              <div className="p-4">
                <RadarChart
                  axes={[t("reports.radarOperational"), t("reports.radarOnTime"), t("reports.radarResolved")]}
                  series={summary.radarSeries.map((s, i) => ({ ...s, color: categoricalColor(i) }))}
                  max={100}
                />
              </div>
            </Card>
          </div>

          <div className="px-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.partsConsumption")}</CardTitle>
              </CardHeader>
              <div className="p-4">
                <ChartFrame isEmpty={summary.partsConsumption.length === 0} emptyLabel={t("reports.noConsumptionData")} height={140}>
                  <RankedBarList
                    formatValue={(v) => `${v} ${t("reports.used").replace(":", "")}`}
                    data={summary.partsConsumption.map(([name, count], i) => {
                      const stock = reportsService.getSparePartStockByName(name);
                      return {
                        label: stock != null ? `${name} (${t("reports.stock")} ${stock})` : name,
                        value: count,
                        color: categoricalColor(i),
                      };
                    })}
                  />
                </ChartFrame>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

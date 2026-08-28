"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PeriodSelect } from "./PeriodSelect";
import { LineChart } from "@/components/charts/LineChart";
import { formatDate } from "@/lib/format";
import { useReportsSummary } from "@/hooks/useReportsSummary";
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
          <div className="px-6 pt-5">
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
                {summary.dailyFaults.length === 0 ? (
                  <p className="text-sm text-text-tertiary">{t("reports.noFaultsInPeriod")}</p>
                ) : (
                  <LineChart
                    height={160}
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
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { PeriodSelect } from "./PeriodSelect";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { RadarChart } from "@/components/charts/RadarChart";
import { formatDate } from "@/lib/format";
import { useReportsSummary } from "@/hooks/useReportsSummary";
import { reportsService } from "@/services";
import type { ReportPeriod } from "@/services/reports.service";

const periodLabel: Record<ReportPeriod, string> = {
  "30d": "Период: последние 30 дней",
  "90d": "Период: последние 90 дней",
  year: "Период: год",
};

export function ReportsClient() {
  const [period, setPeriod] = useState<ReportPeriod>("30d");
  const { data: summary, loading, error, refetch } = useReportsSummary(period);

  return (
    <div className="pb-8">
      <PageHeader
        title="Отчеты и аналитика"
        context={periodLabel[period]}
        actions={
          <>
            <PeriodSelect value={period} onChange={setPeriod} />
            <Button hierarchy="secondary" icon="download" size="sm">
              Экспорт
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mx-6 mt-5 flex flex-col items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary px-4 py-16 text-center">
          <p className="text-sm text-text-secondary">Не удалось загрузить отчеты.</p>
          <p className="text-xs text-text-tertiary">{error}</p>
          <Button hierarchy="secondary" size="sm" onClick={refetch}>
            Повторить
          </Button>
        </div>
      ) : loading || !summary ? (
        <div className="mx-6 mt-5 flex items-center justify-center rounded-xl border border-border-primary bg-bg-secondary px-4 py-16 text-sm text-text-tertiary">
          Загрузка отчетов…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4 xl:grid-cols-6">
            <Metric label="Всего оборудования" value={summary.total} />
            <Metric
              label="В работе"
              value={`${summary.total ? Math.round((summary.operational / summary.total) * 100) : 0}%`}
              tone="success"
            />
            <Metric label="Неисправно" value={summary.faulty} tone="error" />
            <Metric label="В ремонте" value={summary.underRepair} tone="warning" />
            <Metric label="Просроченные проверки" value={summary.overdueInspections} tone="error" />
            <Metric label="Предстоящие проверки" value={summary.upcomingInspections} tone="brand" />
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>MTTR — среднее время ремонта</CardTitle>
              </CardHeader>
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--chip-brand-bg) text-(--chip-brand-text)">
                  <Icon name="clock" size={22} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">{summary.mttrHours} ч.</p>
                  <p className="text-xs text-text-tertiary">
                    Рассчитано по {summary.mttrSampleSize} завершенным ремонтам
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>MTBF — наработка на отказ</CardTitle>
              </CardHeader>
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--chip-success-bg) text-(--chip-success-text)">
                  <Icon name="gauge" size={22} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-text-primary">
                    {summary.mtbfHours.toLocaleString("ru-RU")} ч.
                  </p>
                  <p className="text-xs text-text-tertiary">Оценка по парку из {summary.total} единиц</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Наиболее проблемные типы оборудования</CardTitle>
              </CardHeader>
              <div className="p-4">
                {summary.byTypeFaultCount.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Нет неисправностей за период</p>
                ) : (
                  <BarChart
                    height={160}
                    data={summary.byTypeFaultCount.map(([type, count]) => ({
                      label: type.length > 14 ? type.slice(0, 13) + "…" : type,
                      value: count,
                      color: "var(--color-error-500)",
                    }))}
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Соответствие по аэропортам</CardTitle>
              </CardHeader>
              <div className="space-y-2.5 p-4">
                {summary.complianceByAirport.map(({ airport, pct, count }) => (
                  <div key={airport.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs text-text-tertiary">{airport.city}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-tertiary">
                      <div
                        className={pct >= 90 ? "h-full rounded-full bg-success-500" : "h-full rounded-full bg-warning-500"}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs text-text-quaternary">{count} ед.</span>
                    <span className="w-10 shrink-0 text-right text-sm font-medium text-text-secondary">{pct}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Динамика неисправностей</CardTitle>
              </CardHeader>
              <div className="p-4">
                {summary.dailyFaults.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Нет неисправностей за период</p>
                ) : (
                  <LineChart
                    height={160}
                    series={[
                      {
                        name: "Неисправности",
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

            <Card>
              <CardHeader>
                <CardTitle>Сравнение аэропортов по показателям</CardTitle>
              </CardHeader>
              <div className="flex justify-center p-4">
                <RadarChart
                  size={200}
                  max={100}
                  axes={["Работоспособность", "Проверки в срок", "Устранение"]}
                  series={summary.radarSeries}
                />
              </div>
            </Card>
          </div>

          <div className="px-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Расход запасных частей</CardTitle>
              </CardHeader>
              {summary.partsConsumption.length === 0 ? (
                <p className="p-4 text-sm text-text-tertiary">Нет данных о расходе за период</p>
              ) : (
                <ul className="divide-y divide-border-secondary">
                  {summary.partsConsumption.map(([part, count]) => {
                    const stock = reportsService.getSparePartStockByName(part);
                    return (
                      <li key={part} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon name="package" size={16} className="text-text-quaternary" />
                          <span className="text-text-primary">{part}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-tertiary">
                          <span>Использовано: {count}</span>
                          {stock !== undefined && <span>Остаток: {stock}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warning" | "error" | "brand";
}) {
  const toneText: Record<string, string> = {
    neutral: "text-text-primary",
    success: "text-(--chip-success-text)",
    warning: "text-(--chip-warning-text)",
    error: "text-(--chip-error-text)",
    brand: "text-(--chip-brand-text)",
  };
  return (
    <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
      <p className="text-xs font-medium text-text-tertiary">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneText[tone]}`}>{value}</p>
    </div>
  );
}

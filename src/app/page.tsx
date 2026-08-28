"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { equipment, airports, faults, airportName } from "@/lib/mock-data";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { getFaultStatusConfig } from "@/config/faultStatus.config";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";

const STATUS_CHART_COLOR: Record<string, string> = {
  operational: "var(--color-success-500)",
  faulty: "var(--color-error-500)",
  maintenance: "var(--color-warning-500)",
  reserve: "var(--color-brand-400)",
  requires_inspection: "var(--color-purple-500)",
};

export default function DashboardPage() {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);

  const total = equipment.length;
  const byStatus = {
    operational: equipment.filter((e) => e.status === "operational").length,
    faulty: equipment.filter((e) => e.status === "faulty").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
    reserve: equipment.filter((e) => e.status === "reserve").length,
    requires_inspection: equipment.filter((e) => e.status === "requires_inspection").length,
  };

  const byType = Object.entries(
    equipment.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const byAirport = airports.map((a) => ({
    airport: a,
    count: equipment.filter((e) => e.airportId === a.id).length,
    faulty: equipment.filter((e) => e.airportId === a.id && e.status === "faulty").length,
  }));

  const upcoming = [...equipment]
    .filter((e) => e.nextInspectionAt)
    .sort((a, b) => (a.nextInspectionAt! < b.nextInspectionAt! ? -1 : 1))
    .slice(0, 5);

  const activeFaults = faults.filter((f) => f.stage !== "closed").slice(0, 5);

  return (
    <div className="pb-8">
      <PageHeader
        title={t("dashboard.title")}
        context={t("dashboard.date")}
        actions={
          <Button hierarchy="secondary" icon="refresh" size="sm">
            {t("dashboard.refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard label={t("dashboard.totalEquipment")} value={total} meta={t("dashboard.units")} icon="cpu" tone="neutral" />
        <KPICard
          label={t("dashboard.operational")}
          value={byStatus.operational}
          meta={`${Math.round((byStatus.operational / total) * 100)}%`}
          icon="check-circle"
          tone="success"
        />
        <KPICard
          label={t("dashboard.faulty")}
          value={byStatus.faulty}
          meta={`${Math.round((byStatus.faulty / total) * 100)}%`}
          icon="alert-triangle"
          tone="error"
        />
        <KPICard
          label={t("dashboard.maintenance")}
          value={byStatus.maintenance}
          meta={`${Math.round((byStatus.maintenance / total) * 100)}%`}
          icon="wrench"
          tone="warning"
        />
        <KPICard
          label={t("dashboard.reserve")}
          value={byStatus.reserve}
          meta={`${Math.round((byStatus.reserve / total) * 100)}%`}
          icon="package"
          tone="brand"
        />
        <KPICard
          label={t("dashboard.requiresInspection")}
          value={byStatus.requires_inspection}
          meta={`${Math.round((byStatus.requires_inspection / total) * 100)}%`}
          icon="gauge"
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentStatus")}</CardTitle>
          </CardHeader>
          <div className="p-4">
            <PieChart
              size={140}
              centerLabel={String(total)}
              totalLabel={t("common.total")}
              data={(
                [
                  ["operational", byStatus.operational],
                  ["faulty", byStatus.faulty],
                  ["maintenance", byStatus.maintenance],
                  ["reserve", byStatus.reserve],
                  ["requires_inspection", byStatus.requires_inspection],
                ] as const
              )
                .filter(([, count]) => count > 0)
                .map(([key, count]) => ({
                  label: equipmentStatusConfig[key].label,
                  value: count,
                  color: STATUS_CHART_COLOR[key],
                }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentByType")}</CardTitle>
          </CardHeader>
          <div className="p-4">
            <BarChart
              height={160}
              seriesName={t("common.total")}
              data={byType.slice(0, 5).map(([type, count]) => ({
                label: type.length > 14 ? type.slice(0, 13) + "…" : type,
                value: count,
              }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentByAirport")}</CardTitle>
          </CardHeader>
          <div className="space-y-2.5 p-4">
            {byAirport.map(({ airport, count, faulty }) => (
              <div key={airport.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-bg-tertiary">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Icon name="map-pin" size={16} className="text-text-quaternary" />
                  <span className="text-sm">{airport.city}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-text-primary">{count}</span>
                  {faulty > 0 && (
                    <span className="text-error-400">
                      {faulty} {t("dashboard.faultySuffix")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.upcomingInspections")}</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border-secondary">
            {upcoming.map((eq) => (
              <li key={eq.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <Link href={`/equipment/${eq.id}`} className="truncate text-sm font-medium text-text-primary hover:text-brand-400">
                    {eq.name}
                  </Link>
                  <p className="truncate text-xs text-text-tertiary">{airportName(eq.airportId)}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-warning-400">
                  {formatDate(eq.nextInspectionAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.faults")}</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border-secondary">
            {activeFaults.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <Link href="/faults" className="truncate text-sm font-medium text-text-primary hover:text-brand-400">
                    {f.title}
                  </Link>
                  <p className="truncate text-xs text-text-tertiary">{f.id}</p>
                </div>
                <StatusBadge status={faultStatusConfig[f.stage]} className="shrink-0" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

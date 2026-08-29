"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/data-display/KPICard";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { UzbekistanMap } from "@/components/dashboard/UzbekistanMap";
import { equipment, airports, faults, airportName } from "@/lib/mock-data";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { getFaultStatusConfig } from "@/config/faultStatus.config";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";

const STATUS_CHART_COLOR: Record<string, string> = {
  operational: "var(--color-success-500)",
  faulty: "var(--color-error-500)",
  maintenance: "var(--color-warning-500)",
  reserve: "var(--color-brand-400)",
  requires_inspection: "var(--color-purple-500)",
};

// Pin positions (percent of the 970×590 Uzbekistan map viewBox) — the
// centroid of each city's own path in `uzbekistanRegions.ts` (toshkent_sh,
// samarqand_sh, fargona_sh, buxoro_sh, urganch_sh).
const CITY_POSITIONS: Record<string, { top: string; left: string }> = {
  "air-tas": { top: "52.2%", left: "71.6%" },
  "air-skd": { top: "65.2%", left: "55.6%" },
  "air-fef": { top: "35.4%", left: "63.2%" },
  "air-buk": { top: "61.2%", left: "41.2%" },
  "air-uge": { top: "26.6%", left: "19.7%" },
};

function pct(n: number, total: number) {
  if (!total) return "0,0%";
  return `${(Math.round((n / total) * 1000) / 10).toFixed(1).replace(".", ",")}%`;
}

export default function DashboardPage() {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);

  const [now, setNow] = useState<Date | null>(() => new Date("2026-08-25T10:45:32"));
  useEffect(() => {
    const id = setInterval(() => setNow((d) => (d ? new Date(d.getTime() + 1000) : d)), 1000);
    return () => clearInterval(id);
  }, []);

  const [tableAirportFilter, setTableAirportFilter] = useState("");
  const [tableSearch, setTableSearch] = useState("");

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
    total: equipment.filter((e) => e.airportId === a.id).length,
    operational: equipment.filter((e) => e.airportId === a.id && e.status === "operational").length,
    faulty: equipment.filter((e) => e.airportId === a.id && e.status === "faulty").length,
    maintenance: equipment.filter((e) => e.airportId === a.id && e.status === "maintenance").length,
    reserve: equipment.filter((e) => e.airportId === a.id && e.status === "reserve").length,
  }));

  const upcoming = [...equipment]
    .filter((e) => e.nextInspectionAt)
    .sort((a, b) => (a.nextInspectionAt! < b.nextInspectionAt! ? -1 : 1))
    .slice(0, 5);

  const activeFaults = faults.filter((f) => f.stage !== "closed").slice(0, 5);

  const tableItems = useMemo(() => {
    let items = equipment;
    if (tableAirportFilter) items = items.filter((e) => e.airportId === tableAirportFilter);
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q));
    }
    return items.slice(0, 8);
  }, [tableAirportFilter, tableSearch]);

  function daysUntil(dateStr: string | null) {
    if (!dateStr || !now) return null;
    const diff = Math.round((new Date(dateStr).getTime() - now.getTime()) / 86400000);
    return diff;
  }

  return (
    <div className="pb-8">
      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard label={t("dashboard.totalEquipment")} value={total} meta={t("dashboard.units")} icon="cpu" tone="neutral" />
        <KPICard label={t("dashboard.operational")} value={byStatus.operational} meta={pct(byStatus.operational, total)} icon="check-circle" tone="success" />
        <KPICard label={t("dashboard.faulty")} value={byStatus.faulty} meta={pct(byStatus.faulty, total)} icon="alert-triangle" tone="error" />
        <KPICard label={t("dashboard.maintenance")} value={byStatus.maintenance} meta={pct(byStatus.maintenance, total)} icon="wrench" tone="warning" />
        <KPICard label={t("dashboard.reserve")} value={byStatus.reserve} meta={pct(byStatus.reserve, total)} icon="package" tone="brand" />
        <KPICard label={t("dashboard.requiresInspection")} value={byStatus.requires_inspection} meta={pct(byStatus.requires_inspection, total)} icon="gauge" tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-3">
        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentStatus")}</CardTitle>
            <button className="flex items-center gap-1 text-xs text-text-quaternary hover:text-text-primary">
              <Icon name="refresh" size={13} />
            </button>
          </CardHeader>
          <div className="flex flex-1 items-center justify-center p-4">
            <PieChart
              size={180}
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
          <p className="border-t border-border-secondary px-4 py-2 text-xs text-text-quaternary">
            {t("dashboard.updatedAt")} {now ? `${formatDate(now.toISOString().slice(0, 10))} ${now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentByType")}</CardTitle>
            <Dropdown className="w-40" placeholder={t("common.allAirports")} value="" onChange={() => {}} options={[]} />
          </CardHeader>
          <div className="flex-1 p-4">
            <BarChart
              data={byType.slice(0, 6).map(([type, count]) => ({
                label: type.length > 10 ? `${type.slice(0, 9)}…` : type,
                value: count,
              }))}
              height="100%"
              seriesName={t("dashboard.equipmentByType")}
            />
          </div>
        </Card>

        <Card className="flex h-full flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.mapCard")}</CardTitle>
            <div className="flex items-center gap-1">
              <button className="flex h-6 w-6 items-center justify-center rounded text-text-quaternary hover:bg-bg-tertiary hover:text-text-primary">
                <Icon name="plus" size={13} />
              </button>
              <button className="flex h-6 w-6 items-center justify-center rounded text-text-quaternary hover:bg-bg-tertiary hover:text-text-primary">
                <Icon name="maximize" size={13} />
              </button>
            </div>
          </CardHeader>
          <div className="relative min-h-[220px] flex-1 bg-bg-primary p-3">
            <UzbekistanMap
              className="h-full min-h-[196px] w-full"
              markers={byAirport
                .filter(({ airport }) => CITY_POSITIONS[airport.id])
                .map(({ airport, total: t2, operational, faulty, maintenance, reserve }) => {
                  const pos = CITY_POSITIONS[airport.id];
                  const dominant = faulty > 0 ? "bg-error-500" : maintenance > 0 ? "bg-warning-500" : reserve > 0 && operational === 0 ? "bg-brand-400" : "bg-success-500";
                  return {
                    id: airport.id,
                    top: pos.top,
                    left: pos.left,
                    label: airport.city,
                    render: () => (
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn("flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white shadow", dominant)}>
                          {t2}
                        </div>
                        <span className="whitespace-nowrap text-[10px] font-medium text-text-tertiary">{airport.city}</span>
                      </div>
                    ),
                  };
                })}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.upcomingInspections")}</CardTitle>
            <Link href="/inspections" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("equipment.colEquipment")}</th>
                  <th className="px-4 py-2.5">{t("equipment.colAirport")}</th>
                  <th className="px-4 py-2.5">{t("equipment.colNextInspection")}</th>
                  <th className="px-4 py-2.5 text-right">{t("dashboard.inDaysSuffix")}</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((eq) => {
                  const d = daysUntil(eq.nextInspectionAt);
                  return (
                    <tr key={eq.id} className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary">
                      <td className="px-4 py-2.5">
                        <Link href={`/equipment/${eq.id}`} className="font-medium text-text-primary hover:text-brand-400">
                          {eq.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{airportName(eq.airportId)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatDate(eq.nextInspectionAt)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-warning-400">
                        {d != null && d >= 0 ? `${t("dashboard.inDaysPrefix")} ${d} ${t("dashboard.inDaysSuffix")}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.faults")}</CardTitle>
            <Link href="/faults" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("equipment.colEquipment")}</th>
                  <th className="px-4 py-2.5">{t("equipment.colAirport")}</th>
                  <th className="px-4 py-2.5 text-right">{t("equipment.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {activeFaults.map((f) => {
                  const eq = equipment.find((e) => e.id === f.equipmentId);
                  return (
                    <tr key={f.id} className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary">
                      <td className="px-4 py-2.5">
                        <Link href="/faults" className="font-medium text-text-primary hover:text-brand-400">
                          {eq?.name ?? f.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{eq ? airportName(eq.airportId) : f.id}</td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge status={faultStatusConfig[f.stage]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="px-6 pt-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t("dashboard.equipment")}</CardTitle>
            <Link href="/equipment" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("dashboard.viewFullRegistry")}
            </Link>
          </CardHeader>
          <div className="flex flex-wrap items-center gap-2 border-b border-border-secondary px-4 py-2.5">
            <Dropdown
              className="w-48"
              placeholder={t("common.allAirports")}
              value={tableAirportFilter}
              onChange={setTableAirportFilter}
              options={airports.map((a) => ({ value: a.id, label: a.city }))}
            />
            <div className="flex-1" />
            <Input
              icon="search"
              placeholder={t("equipment.searchPlaceholder")}
              className="w-56"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            <Link href="/equipment/new">
              <Button hierarchy="primary" icon="plus" size="sm">
                {t("common.add")}
              </Button>
            </Link>
          </div>
          <EquipmentTable items={tableItems} full />
        </Card>
      </div>
    </div>
  );
}

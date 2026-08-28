"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { equipment, airports, faults, notifications, airportName } from "@/lib/mock-data";
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

// Stylized pin positions (percent of the map panel) — approximate relative
// geography of the five airport cities used by this app's mock dataset.
const CITY_POSITIONS: Record<string, { top: string; left: string }> = {
  "air-tas": { top: "32%", left: "78%" },
  "air-skd": { top: "58%", left: "42%" },
  "air-fef": { top: "30%", left: "88%" },
  "air-buk": { top: "55%", left: "20%" },
  "air-uge": { top: "38%", left: "8%" },
};

function pct(n: number, total: number) {
  if (!total) return "0,0%";
  return `${(Math.round((n / total) * 1000) / 10).toFixed(1).replace(".", ",")}%`;
}

export default function DashboardPage() {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date("2026-08-25T10:45:32"));
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
      <PageHeader
        title={t("dashboard.title")}
        actions={
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{now ? formatDate(now.toISOString().slice(0, 10)) : ""}</p>
              <p className="font-mono text-xs text-text-tertiary">
                {now ? now.toLocaleTimeString("ru-RU", { hour12: false }) : "--:--:--"}
              </p>
            </div>
            <Button hierarchy="secondary" icon="refresh" size="sm">
              {t("dashboard.refresh")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard label={t("dashboard.totalEquipment")} value={total} meta={t("dashboard.units")} icon="cpu" tone="neutral" />
        <KPICard label={t("dashboard.operational")} value={byStatus.operational} meta={pct(byStatus.operational, total)} icon="check-circle" tone="success" />
        <KPICard label={t("dashboard.faulty")} value={byStatus.faulty} meta={pct(byStatus.faulty, total)} icon="alert-triangle" tone="error" />
        <KPICard label={t("dashboard.maintenance")} value={byStatus.maintenance} meta={pct(byStatus.maintenance, total)} icon="wrench" tone="warning" />
        <KPICard label={t("dashboard.reserve")} value={byStatus.reserve} meta={pct(byStatus.reserve, total)} icon="package" tone="brand" />
        <KPICard label={t("dashboard.requiresInspection")} value={byStatus.requires_inspection} meta={pct(byStatus.requires_inspection, total)} icon="gauge" tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentStatus")}</CardTitle>
            <button className="flex items-center gap-1 text-xs text-text-quaternary hover:text-text-primary">
              <Icon name="refresh" size={13} />
            </button>
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
          <p className="border-t border-border-secondary px-4 py-2 text-xs text-text-quaternary">
            {t("dashboard.updatedAt")} {now ? `${formatDate(now.toISOString().slice(0, 10))} ${now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.equipmentByType")}</CardTitle>
            <Dropdown className="w-40" placeholder={t("common.allAirports")} value="" onChange={() => {}} options={[]} />
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

        <Card className="overflow-hidden">
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
          <div className="relative h-[220px] bg-[linear-gradient(var(--border-secondary)_1px,transparent_1px),linear-gradient(90deg,var(--border-secondary)_1px,transparent_1px)] bg-[length:16px_16px] bg-bg-primary">
            {byAirport.map(({ airport, total: t2, operational, faulty, maintenance, reserve }) => {
              const pos = CITY_POSITIONS[airport.id];
              if (!pos) return null;
              const dominant = faulty > 0 ? "bg-error-500" : maintenance > 0 ? "bg-warning-500" : reserve > 0 && operational === 0 ? "bg-brand-400" : "bg-success-500";
              return (
                <div key={airport.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: pos.top, left: pos.left }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn("flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white shadow", dominant)}>
                      {t2}
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-medium text-text-tertiary">{airport.city}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.upcomingInspections")}</CardTitle>
            <Link href="/inspections" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border-secondary">
            {upcoming.map((eq) => {
              const d = daysUntil(eq.nextInspectionAt);
              return (
                <li key={eq.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/equipment/${eq.id}`} className="truncate text-sm font-medium text-text-primary hover:text-brand-400">
                      {eq.name}
                    </Link>
                    <p className="truncate text-xs text-text-tertiary">{airportName(eq.airportId)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-warning-400">
                    {d != null && d >= 0
                      ? `${t("dashboard.inDaysPrefix")} ${d} ${t("dashboard.inDaysSuffix")}`
                      : formatDate(eq.nextInspectionAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.faults")}</CardTitle>
            <Link href="/faults" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border-secondary">
            {activeFaults.map((f) => {
              const eq = equipment.find((e) => e.id === f.equipmentId);
              return (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <Link href="/faults" className="truncate text-sm font-medium text-text-primary hover:text-brand-400">
                      {eq?.name ?? f.title}
                    </Link>
                    <p className="truncate text-xs text-text-tertiary">{eq ? airportName(eq.airportId) : f.id}</p>
                  </div>
                  <StatusBadge status={faultStatusConfig[f.stage]} className="shrink-0" />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.notifications")}</CardTitle>
            <Link href="/notifications" className="text-xs font-medium text-brand-400 hover:text-brand-300">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border-secondary">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-4 py-2.5">
                <Icon
                  name={n.severity === "critical" ? "alert-triangle" : n.severity === "warning" ? "clock" : "bell"}
                  size={16}
                  className={cn(
                    "mt-0.5 shrink-0",
                    n.severity === "critical" ? "text-error-400" : n.severity === "warning" ? "text-warning-400" : "text-brand-400"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{n.title}</p>
                  <p className="truncate text-xs text-text-tertiary">{n.description}</p>
                </div>
                <span className="shrink-0 text-xs text-text-quaternary">
                  {new Date(`${n.createdAt}T${n.severity === "critical" ? "10:15" : n.severity === "warning" ? "10:30" : "09:45"}:00`).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
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

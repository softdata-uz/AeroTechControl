"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import type { StatusVisual } from "@/config/equipmentStatus.config";
import { airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { useCalibrationList } from "@/hooks/useCalibrationList";
import { useAsync } from "@/hooks/useAsync";
import { calibrationService } from "@/services";
import type { CalibrationStatus } from "@/services/calibration.service";

const calibrationStatusConfig: Record<CalibrationStatus, StatusVisual> = {
  overdue: {
    label: "Просрочено",
    dot: "bg-error-500",
    badgeBg: "bg-(--chip-error-bg)",
    badgeText: "text-(--chip-error-text)",
    badgeBorder: "border-(--chip-error-border)",
  },
  upcoming: {
    label: "Ближайшие 30 дней",
    dot: "bg-warning-500",
    badgeBg: "bg-(--chip-warning-bg)",
    badgeText: "text-(--chip-warning-text)",
    badgeBorder: "border-(--chip-warning-border)",
  },
  planned: {
    label: "Запланировано",
    dot: "bg-brand-400",
    badgeBg: "bg-(--chip-brand-bg)",
    badgeText: "text-(--chip-brand-text)",
    badgeBorder: "border-(--chip-brand-border)",
  },
};

export function CalibrationClient() {
  const [airportFilter, setAirportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<CalibrationStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    airportId: airportFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    pageSize: 100,
  };

  const { data, loading, error, refetch } = useCalibrationList(filters);
  const records = useMemo(() => data?.items ?? [], [data]);

  // KPI cards reflect the full equipment set, independent of the table filters.
  const { data: allRecordsPage } = useAsync(
    () => calibrationService.listCalibrationRecords({ pageSize: 1000 }),
    []
  );
  const kpi = useMemo(() => {
    const all = allRecordsPage?.items ?? [];
    return {
      total: all.length,
      overdue: all.filter((r) => r.status === "overdue").length,
      upcoming: all.filter((r) => r.status === "upcoming").length,
      planned: all.filter((r) => r.status === "planned").length,
    };
  }, [allRecordsPage]);

  return (
    <div className="pb-8">
      <PageHeader
        title="Поверка / Калибровка"
        context={`Всего единиц оборудования: ${kpi.total}`}
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label="Всего" value={kpi.total} icon="gauge" tone="neutral" />
        <KPICard label="Просрочено" value={kpi.overdue} icon="alert-triangle" tone="error" />
        <KPICard label="Ближайшие 30 дней" value={kpi.upcoming} icon="clock" tone="warning" />
        <KPICard label="Запланировано" value={kpi.planned} icon="clipboard-check" tone="brand" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
        <Dropdown
          className="w-44"
          placeholder="Все аэропорты"
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: a.id, label: a.city }))}
        />
        <Dropdown
          className="w-48"
          placeholder="Все статусы"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as CalibrationStatus | "")}
          options={Object.entries(calibrationStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder="Поиск по оборудованию..."
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Не удалось загрузить данные поверки.</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                Повторить
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              Загрузка…
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Оборудование не найдено.</p>
              <p className="text-xs text-text-tertiary">Измените параметры поиска или фильтры.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">Оборудование</th>
                  <th className="px-4 py-2.5">Аэропорт</th>
                  <th className="px-4 py-2.5">Последняя поверка</th>
                  <th className="px-4 py-2.5">Следующая поверка</th>
                  <th className="px-4 py-2.5">Сертификат</th>
                  <th className="px-4 py-2.5">Статус</th>
                </tr>
              </thead>
              <tbody>
                {records.map(({ equipment: eq, status, certificate }) => (
                  <tr
                    key={eq.id}
                    className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/equipment/${eq.id}`} className="font-medium text-text-primary hover:text-brand-400">
                        {eq.name}
                      </Link>
                      <p className="text-xs text-text-tertiary">{eq.code}</p>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">{airportName(eq.airportId)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{formatDate(eq.lastInspectionAt)}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{formatDate(eq.nextInspectionAt)}</td>
                    <td className="px-4 py-2.5">
                      {certificate ? (
                        <span className="inline-flex items-center gap-1.5 text-text-secondary">
                          <Icon name="file-text" size={14} className="text-text-quaternary" />
                          {certificate.title}
                        </span>
                      ) : (
                        <span className="text-text-quaternary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={calibrationStatusConfig[status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

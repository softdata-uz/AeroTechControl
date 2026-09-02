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
import { Pagination } from "@/components/ui/Pagination";
import { getCalibrationStatusConfig } from "@/config/inspectionStatus.config";
import { useLocations } from "@/hooks/useLocations";
import { formatDate } from "@/lib/format";
import { useCalibrationList } from "@/hooks/useCalibrationList";
import { useAsync } from "@/hooks/useAsync";
import { calibrationService } from "@/services";
import type { CalibrationStatus } from "@/services/calibration.service";
import { useTranslations } from "@/lib/locale-context";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function CalibrationClient() {
  const t = useTranslations();
  const { airports, airportName } = useLocations();
  const calibrationStatusConfig = getCalibrationStatusConfig(t);

  const [airportFilter, setAirportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<CalibrationStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [airportFilter, statusFilter, search, pageSize]);

  const filters = {
    airportId: airportFilter ? Number(airportFilter) : undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    pageSize,
  };

  const { data, loading, error, refetch } = useCalibrationList(filters);
  const records = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t("calibration.title")} context={`${t("calibration.totalEquipmentSuffix")} ${kpi.total}`} />

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-6 pt-5">
        <Dropdown
          className="w-52"
          placeholder={t("common.allAirports")}
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: String(a.id), label: a.name }))}
        />
        <Dropdown
          className="w-52"
          placeholder={t("common.allStatuses")}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as CalibrationStatus | "")}
          options={Object.entries(calibrationStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder={t("calibration.searchPlaceholder")}
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pt-4 sm:grid-cols-4">
        <KPICard label={t("calibration.kpiTotal")} value={kpi.total} icon="gauge" tone="neutral" />
        <KPICard label={t("calibration.kpiOverdue")} value={kpi.overdue} icon="alert-triangle" tone="error" />
        <KPICard label={t("calibration.kpiUpcoming")} value={kpi.upcoming} icon="clock" tone="warning" />
        <KPICard label={t("calibration.kpiPlanned")} value={kpi.planned} icon="clipboard-check" tone="brand" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          <div className="min-h-0 flex-1">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("calibration.loadError")}</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              {t("calibration.loading")}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("calibration.notFound")}</p>
              <p className="text-xs text-text-tertiary">{t("calibration.changeFilters")}</p>
            </div>
          ) : (
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-bg-secondary">
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("calibration.colEquipment")}</th>
                  <th className="px-4 py-2.5">{t("calibration.colAirport")}</th>
                  <th className="px-4 py-2.5">{t("calibration.colLastCheck")}</th>
                  <th className="px-4 py-2.5">{t("calibration.colNextCheck")}</th>
                  <th className="px-4 py-2.5">{t("calibration.colCertificate")}</th>
                  <th className="px-4 py-2.5">{t("calibration.colStatus")}</th>
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
                    <td className="px-4 py-2.5 text-text-secondary">{eq.airport.name}</td>
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
          <div className="flex shrink-0 items-center justify-between border-t border-border-primary px-4 py-3 text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <span>{t("common.showingPerPage")}</span>
              <Dropdown
                className="w-20"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value))}
                options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <span>
                {rangeStart}–{rangeEnd} {t("common.of")} {total} {t("common.records")}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

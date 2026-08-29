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
import { getCalibrationStatusConfig } from "@/config/inspectionStatus.config";
import { airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { useCalibrationList } from "@/hooks/useCalibrationList";
import { useAsync } from "@/hooks/useAsync";
import { calibrationService } from "@/services";
import type { CalibrationStatus } from "@/services/calibration.service";
import { useTranslations } from "@/lib/locale-context";

export function CalibrationClient() {
  const t = useTranslations();
  const calibrationStatusConfig = getCalibrationStatusConfig(t);

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
      <PageHeader title={t("calibration.title")} context={`${t("calibration.totalEquipmentSuffix")} ${kpi.total}`} />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label={t("calibration.kpiTotal")} value={kpi.total} icon="gauge" tone="neutral" />
        <KPICard label={t("calibration.kpiOverdue")} value={kpi.overdue} icon="alert-triangle" tone="error" />
        <KPICard label={t("calibration.kpiUpcoming")} value={kpi.upcoming} icon="clock" tone="warning" />
        <KPICard label={t("calibration.kpiPlanned")} value={kpi.planned} icon="clipboard-check" tone="brand" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
        <Dropdown
          className="w-52"
          placeholder={t("common.allAirports")}
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: a.id, label: a.city }))}
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

      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
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

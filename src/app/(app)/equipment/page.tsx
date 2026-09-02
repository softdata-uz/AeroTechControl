"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Pagination } from "@/components/ui/Pagination";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import type { EquipmentStatus } from "@/lib/types";
import { useEquipmentList } from "@/hooks/useEquipmentList";
import { useLocations } from "@/hooks/useLocations";
import { useEquipmentTypes } from "@/hooks/useEquipmentLookups";
import { useTranslations } from "@/lib/locale-context";
import { exportEquipment } from "@/services/equipment.service";
import { usePermissions } from "@/hooks/usePermissions";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function EquipmentRegistryPage() {
  const router = useRouter();
  const t = useTranslations();
  const { canWrite } = usePermissions();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const { airports } = useLocations();
  const { types: equipmentTypes } = useEquipmentTypes();
  const [airportFilter, setAirportFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Debounce free-text search so we don't re-query on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Filters or page size changed -> back to page 1.
  useEffect(() => {
    setPage(1);
  }, [airportFilter, typeFilter, statusFilter, search, pageSize]);

  const { data, loading, error, refetch } = useEquipmentList({
    airportId: airportFilter ? Number(airportFilter) : undefined,
    equipmentTypeId: typeFilter ? Number(typeFilter) : undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      await exportEquipment({
        airportId: airportFilter ? Number(airportFilter) : undefined,
        equipmentTypeId: typeFilter ? Number(typeFilter) : undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("equipment.title")}
        context={`${t("equipment.totalRecords")} ${total}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm" disabled={exporting} onClick={handleExport}>
              {t("common.export")}
            </Button>
            <Button hierarchy="secondary" icon="printer" size="sm">
              {t("common.print")}
            </Button>
            {canWrite && (
              <Button hierarchy="primary" icon="plus" size="sm" onClick={() => router.push("/equipment/new")}>
                {t("equipment.addEquipment")}
              </Button>
            )}
          </>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-primary bg-bg-secondary px-6 py-3">
        <Dropdown
          className="w-56"
          placeholder={t("common.allAirports")}
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: String(a.id), label: a.name }))}
        />
        <Dropdown
          className="w-56"
          placeholder={t("common.allTypes")}
          value={typeFilter}
          onChange={setTypeFilter}
          options={equipmentTypes.map((et) => ({ value: String(et.id), label: et.name }))}
        />
        <Dropdown
          className="w-56"
          placeholder={t("common.allStatuses")}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as EquipmentStatus | "")}
          options={Object.entries(equipmentStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder={t("equipment.searchPlaceholder")}
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button hierarchy="secondary" icon="filter" size="sm">
          {t("common.filters")}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          <div className="min-h-0 flex-1">
            {error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                <p className="text-sm text-text-secondary">{t("equipment.loadError")}</p>
                <p className="text-xs text-text-tertiary">{error}</p>
                <Button hierarchy="secondary" size="sm" onClick={refetch}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
                {t("equipment.loading")}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                <p className="text-sm text-text-secondary">{t("equipment.notFound")}</p>
                <p className="text-xs text-text-tertiary">{t("equipment.changeFilters")}</p>
              </div>
            ) : (
              <EquipmentTable items={items} full scrollable />
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

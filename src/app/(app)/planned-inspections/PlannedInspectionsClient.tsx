"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/data-display/KPICard";
import { Checkbox, Radio } from "@/components/ui/Checkbox";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { StatusBadge } from "@/components/ui/Badge";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { useLocations } from "@/hooks/useLocations";
import { equipmentService, inspectionsService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { useAsync } from "@/hooks/useAsync";
import type { Equipment } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type Kind = "regulation" | "protocol";

export function PlannedInspectionsClient() {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const { airports } = useLocations();
  const { types, regulations, protocolTemplates } = useEquipmentLookups();

  const [airportId, setAirportId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setPage(1);
  }, [airportId, equipmentTypeId, search, pageSize]);

  const filters = useMemo(
    () => ({
      airportId: airportId ? Number(airportId) : undefined,
      equipmentTypeId: equipmentTypeId ? Number(equipmentTypeId) : undefined,
      search: search || undefined,
      page,
      pageSize,
    }),
    [airportId, equipmentTypeId, search, page, pageSize]
  );

  const { data, loading } = useAsync(() => equipmentService.listEquipment(filters), [filters]);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // KPI row reflects the full planned-inspection backlog, independent of the
  // equipment-table filters below.
  const { data: allPlannedPage } = useAsync(
    () => inspectionsService.listInspections({ status: "planned", pageSize: 1000 }),
    []
  );
  const kpi = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOffset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const in3 = dayOffset(3);
    const in7 = dayOffset(7);
    const in30 = dayOffset(30);
    const all = allPlannedPage?.items ?? [];
    return {
      overdue: all.filter((i) => i.scheduledAt < todayStr).length,
      dueSoon: all.filter((i) => i.scheduledAt >= todayStr && i.scheduledAt <= in3).length,
      nextWeek: all.filter((i) => i.scheduledAt > in3 && i.scheduledAt <= in7).length,
      nextMonth: all.filter((i) => i.scheduledAt > in7 && i.scheduledAt <= in30).length,
    };
  }, [allPlannedPage]);

  const [selected, setSelected] = useState<Map<number, Equipment>>(new Map());

  function toggle(eq: Equipment, checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(eq.id, eq);
      else next.delete(eq.id);
      return next;
    });
  }

  const allOnPageSelected = items.length > 0 && items.every((eq) => selected.has(eq.id));

  function toggleAllOnPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const eq of items) {
        if (checked) next.set(eq.id, eq);
        else next.delete(eq.id);
      }
      return next;
    });
  }

  const selectedList = Array.from(selected.values());
  const selectedTypeIds = new Set(selectedList.map((eq) => eq.equipmentType.id));
  const singleTypeId = selectedTypeIds.size === 1 ? selectedList[0]?.equipmentType.id : null;

  const [kind, setKind] = useState<Kind>("regulation");
  const [regulationId, setRegulationId] = useState("");
  const [protocolTemplateId, setProtocolTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const regulationOptions = singleTypeId
    ? regulations.filter((r) => r.equipmentTypeId === singleTypeId)
    : [];
  const protocolOptions = singleTypeId
    ? protocolTemplates.filter((p) => p.equipmentTypeId === singleTypeId)
    : [];

  useEffect(() => {
    setRegulationId("");
    setProtocolTemplateId("");
  }, [singleTypeId, kind]);

  const canSubmit =
    selectedList.length > 0 &&
    singleTypeId != null &&
    !!scheduledAt &&
    (kind === "regulation" ? !!regulationId : !!protocolTemplateId);

  async function handleSubmit() {
    if (!canSubmit || !scheduledAt) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await inspectionsService.createPlannedInspections({
        equipmentIds: selectedList.map((eq) => eq.id),
        scheduledAt,
        regulationId: kind === "regulation" ? Number(regulationId) : undefined,
        protocolTemplateId: kind === "protocol" ? Number(protocolTemplateId) : undefined,
      });
      setSuccess(true);
      setSelected(new Map());
      setRegulationId("");
      setProtocolTemplateId("");
      setScheduledAt(null);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : t("settingsCrud.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("plannedInspections.title")}
        context={t("plannedInspections.context")}
      />

      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label={t("plannedInspections.kpiOverdue")} value={kpi.overdue} icon="alert-triangle" tone="error" />
        <KPICard label={t("plannedInspections.kpiDueSoon")} value={kpi.dueSoon} icon="clock" tone="warning" />
        <KPICard label={t("plannedInspections.kpiNextWeek")} value={kpi.nextWeek} icon="calendar-date" tone="neutral" />
        <KPICard label={t("plannedInspections.kpiNextMonth")} value={kpi.nextMonth} icon="calendar-date" tone="neutral" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-4 xl:grid-cols-[1fr_360px]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border-secondary px-4 py-3">
            <Dropdown
              clearable
              className="w-48"
              placeholder={t("common.allAirports")}
              value={airportId}
              onChange={setAirportId}
              options={airports.map((a) => ({ value: String(a.id), label: a.name }))}
            />
            <Dropdown
              clearable
              className="w-48"
              placeholder={t("common.allTypes")}
              value={equipmentTypeId}
              onChange={setEquipmentTypeId}
              options={types.map((ty) => ({ value: String(ty.id), label: ty.name }))}
            />
            <Input
              icon="search"
              placeholder={t("equipment.searchPlaceholder")}
              className="w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {(airportId || equipmentTypeId || search) && (
              <Button
                hierarchy="secondary"
                icon="x"
                size="sm"
                onClick={() => {
                  setAirportId("");
                  setEquipmentTypeId("");
                  setSearch("");
                }}
              >
                {t("common.clearFilters")}
              </Button>
            )}
            <span className="ml-auto text-xs text-text-quaternary">
              {t("plannedInspections.selected")} {selectedList.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-text-tertiary">{t("common.loading")}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-tertiary">{t("equipment.notFound")}</p>
            ) : (
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-bg-secondary">
                  <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                    <th className="w-10 px-4 py-2.5">
                      <Checkbox checked={allOnPageSelected} onChange={toggleAllOnPage} />
                    </th>
                    <th className="px-4 py-2.5">{t("equipment.colEquipment")}</th>
                    <th className="px-4 py-2.5">{t("equipment.colType")}</th>
                    <th className="px-4 py-2.5">{t("equipment.colAirport")}</th>
                    <th className="px-4 py-2.5">{t("equipment.colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((eq) => (
                    <tr
                      key={eq.id}
                      className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                    >
                      <td className="px-4 py-2.5">
                        <Checkbox checked={selected.has(eq.id)} onChange={(checked) => toggle(eq, checked)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-text-primary">{eq.name}</p>
                        <p className="text-xs text-text-tertiary">{eq.serialNumber}</p>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{eq.equipmentType.name}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{eq.airport.name}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={equipmentStatusConfig[eq.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Card>

        <Card className="flex h-fit flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-text-primary">{t("plannedInspections.planPanelTitle")}</p>

          {selectedList.length > 0 && selectedTypeIds.size > 1 && (
            <p className="rounded-md border border-(--chip-warning-border) bg-(--chip-warning-bg) px-3 py-2 text-xs text-(--chip-warning-text)">
              {t("plannedInspections.mixedTypesWarning")}
            </p>
          )}

          <div className="flex gap-4">
            <Radio
              checked={kind === "regulation"}
              onChange={() => setKind("regulation")}
              label={t("plannedInspections.kindRegulation")}
              name="planned-inspection-kind"
            />
            <Radio
              checked={kind === "protocol"}
              onChange={() => setKind("protocol")}
              label={t("plannedInspections.kindProtocol")}
              name="planned-inspection-kind"
            />
          </div>

          {kind === "regulation" ? (
            <Dropdown
              label={t("plannedInspections.regulationLabel")}
              placeholder={
                singleTypeId == null
                  ? t("plannedInspections.selectEquipmentFirst")
                  : t("plannedInspections.selectRegulation")
              }
              value={regulationId}
              onChange={setRegulationId}
              options={regulationOptions.map((r) => ({ value: String(r.id), label: r.name }))}
            />
          ) : (
            <Dropdown
              label={t("plannedInspections.protocolLabel")}
              placeholder={
                singleTypeId == null
                  ? t("plannedInspections.selectEquipmentFirst")
                  : t("plannedInspections.selectProtocol")
              }
              value={protocolTemplateId}
              onChange={setProtocolTemplateId}
              options={protocolOptions.map((p) => ({ value: String(p.id), label: p.name }))}
            />
          )}

          <DatePicker
            label={t("plannedInspections.scheduledAt")}
            value={scheduledAt}
            onChange={setScheduledAt}
          />

          {error && (
            <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-xs text-(--chip-error-text)">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-(--chip-success-border) bg-(--chip-success-bg) px-3 py-2 text-xs text-(--chip-success-text)">
              {t("plannedInspections.success")}
            </p>
          )}

          <Button hierarchy="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {t("plannedInspections.submit")}
          </Button>
        </Card>
      </div>
    </div>
  );
}

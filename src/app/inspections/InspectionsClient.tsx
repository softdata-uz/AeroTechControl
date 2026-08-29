"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { Tabs } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { getInspectionStatusConfig, getChecklistResultConfig } from "@/config/inspectionStatus.config";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { getRepairStatusConfig } from "@/config/repairStatus.config";
import { equipmentById, airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { InspectionStatus } from "@/lib/types";
import { useInspectionsList } from "@/hooks/useInspectionsList";
import { useAsync } from "@/hooks/useAsync";
import { inspectionsService, repairsService, documentsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

const PAGE_SIZE = 10;

export function InspectionsClient() {
  const t = useTranslations();
  const inspectionStatusConfig = getInspectionStatusConfig(t);
  const checklistResultConfig = getChecklistResultConfig(t);
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const repairStatusConfig = getRepairStatusConfig(t);

  const viewTabs = [
    { key: "inspections", label: t("inspections.tabInspections") },
    { key: "maintenance", label: t("inspections.tabMaintenance") },
  ] as const;
  const detailTabs = [
    { key: "info", label: t("inspections.tabInfo") },
    { key: "history", label: t("equipment.detail.tabInspections") },
    { key: "repairs", label: t("equipment.detail.tabRepairs") },
    { key: "documents", label: t("equipment.detail.tabDocuments") },
  ] as const;

  const [view, setView] = useState<(typeof viewTabs)[number]["key"]>("inspections");
  const [detailTab, setDetailTab] = useState<(typeof detailTabs)[number]["key"]>("history");
  const [airportFilter, setAirportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | "">("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [onlyNonCompliant, setOnlyNonCompliant] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    airportId: airportFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    pageSize: 1000,
  };

  const {
    data: inspectionsPage,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useInspectionsList(filters);
  const allInspections = useMemo(() => inspectionsPage?.items ?? [], [inspectionsPage]);
  const totalPages = Math.max(1, Math.ceil(allInspections.length / PAGE_SIZE));
  const inspections = allInspections.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [airportFilter, statusFilter, search]);

  // KPI cards reflect overall operational state, independent of the list filters.
  const { data: allInspectionsPage, refetch: refetchKpi } = useAsync(
    () => inspectionsService.listInspections({ pageSize: 1000 }),
    []
  );
  const kpi = useMemo(() => {
    const all = allInspectionsPage?.items ?? [];
    const total = all.length;
    const completed = all.filter((i) => i.status === "completed").length;
    const planned = all.filter((i) => i.status === "planned").length;
    const overdue = all.filter((i) => i.status === "overdue").length;
    const requiresAttention = all.filter((i) => i.status === "requires_review").length;
    return { total, completed, planned, overdue, requiresAttention };
  }, [allInspectionsPage]);

  useEffect(() => {
    if (inspections.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!inspections.some((i) => i.id === selectedId)) {
      setSelectedId(inspections[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspections]);

  const selected = allInspections.find((i) => i.id === selectedId) ?? null;
  const equipment = selected ? equipmentById(selected.equipmentId) : null;

  const { data: history } = useAsync(
    () => (equipment ? inspectionsService.listInspectionsForEquipment(equipment.id) : Promise.resolve([])),
    [equipment?.id]
  );
  const { data: equipmentRepairs } = useAsync(
    () => (equipment ? repairsService.listRepairs({ equipmentId: equipment.id, pageSize: 100 }) : Promise.resolve(null)),
    [equipment?.id]
  );
  const { data: equipmentDocuments } = useAsync(
    () => (equipment ? documentsService.listDocuments({ equipmentId: equipment.id, pageSize: 100 }) : Promise.resolve(null)),
    [equipment?.id]
  );
  const lastInspection = history && history.length > 0 ? history[history.length - 1] : null;

  const {
    data: checklistData,
    loading: checklistLoading,
    refetch: refetchChecklist,
  } = useAsync(
    () => (selected ? inspectionsService.getInspectionChecklist(selected.id) : Promise.resolve([])),
    [selected?.id]
  );
  const fullChecklist = checklistData ?? [];
  const checklist = onlyNonCompliant ? fullChecklist.filter((c) => c.result === "non_compliant") : fullChecklist;
  const doneCount = fullChecklist.filter((c) => c.result !== "pending").length;
  const progressPct = fullChecklist.length ? Math.round((doneCount / fullChecklist.length) * 100) : 0;

  async function handleComplete() {
    if (!selected) return;
    const result = fullChecklist.some((c) => c.result === "non_compliant") ? "non_compliant" : "compliant";
    setCompleting(true);
    try {
      await inspectionsService.completeInspection(selected.id, result);
      await Promise.all([refetchList(), refetchKpi(), refetchChecklist()]);
    } finally {
      setCompleting(false);
    }
  }

  const typeLabel = (type: "periodic" | "unscheduled" | "post_repair") =>
    type === "periodic" ? t("inspections.typePeriodic") : type === "unscheduled" ? t("inspections.typeUnscheduled") : t("inspections.typePostRepair");

  return (
    <div className="pb-8">
      <PageHeader
        title={t("inspections.title")}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              {t("common.export")}
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm">
              {t("inspections.newInspection")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-5">
        <KPICard label={t("inspections.kpiTotal")} value={kpi.total} meta={t("inspections.kpiPeriod")} icon="clipboard-check" tone="neutral" />
        <KPICard
          label={t("inspections.kpiCompleted")}
          value={kpi.completed}
          meta={`${kpi.total ? Math.round((kpi.completed / kpi.total) * 1000) / 10 : 0}%`}
          icon="check-circle"
          tone="success"
        />
        <KPICard
          label={t("inspections.kpiPlanned")}
          value={kpi.planned}
          meta={`${kpi.total ? Math.round((kpi.planned / kpi.total) * 1000) / 10 : 0}%`}
          icon="clock"
          tone="warning"
        />
        <KPICard
          label={t("inspections.kpiOverdue")}
          value={kpi.overdue}
          meta={`${kpi.total ? Math.round((kpi.overdue / kpi.total) * 1000) / 10 : 0}%`}
          icon="alert-triangle"
          tone="error"
        />
        <KPICard label={t("inspections.kpiRequiresAttention")} value={kpi.requiresAttention} meta={t("inspections.kpiEquipmentSuffix")} icon="gauge" tone="purple" />
      </div>

      <Tabs items={viewTabs} value={view} onChange={setView} className="mt-5 px-6" />

      {view === "maintenance" ? (
        <div className="mx-6 mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-secondary py-16 text-text-tertiary">
          <Icon name="wrench" size={24} />
          <p className="text-sm">{t("inspections.maintenanceComingSoon")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border-primary bg-bg-secondary px-6 py-3">
            <Dropdown
              className="w-52"
              placeholder={t("common.allAirports")}
              value={airportFilter}
              onChange={setAirportFilter}
              options={airports.map((a) => ({ value: a.id, label: a.city }))}
            />
            <Dropdown className="w-56" placeholder={t("common.allTypes")} value="" onChange={() => {}} options={[]} />
            <Dropdown
              className="w-52"
              placeholder={t("common.allStatuses")}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as InspectionStatus | "")}
              options={Object.entries(inspectionStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            />
            <DatePicker className="w-40" value={dateFrom} onChange={setDateFrom} placeholder={t("faults.dateFrom")} />
            <DatePicker className="w-40" value={dateTo} onChange={setDateTo} placeholder={t("faults.dateTo")} />
            <div className="flex-1" />
            <Input
              icon="search"
              placeholder={t("inspections.searchPlaceholder")}
              className="w-64"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 2xl:grid-cols-[320px_1fr_380px]">
            {/* LEFT: inspection list */}
            <div className="flex flex-col gap-3">
              <p className="px-1 text-xs text-text-tertiary">
                {t("inspections.totalCount")} {allInspections.length}
              </p>
              {listError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-center">
                  <p className="text-xs text-text-secondary">{t("inspections.loadError")}</p>
                  <Button hierarchy="secondary" size="sm" onClick={refetchList}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : listLoading ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-xs text-text-tertiary">
                  {t("inspections.loading")}
                </div>
              ) : inspections.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-center">
                  <p className="text-xs text-text-secondary">{t("inspections.notFound")}</p>
                  <p className="text-xs text-text-tertiary">{t("inspections.changeFilters")}</p>
                </div>
              ) : (
                <ul className="flex-1 space-y-1.5 overflow-y-auto">
                  {inspections.map((ins) => {
                    const eq = equipmentById(ins.equipmentId);
                    const active = ins.id === selectedId;
                    return (
                      <li key={ins.id}>
                        <button
                          onClick={() => setSelectedId(ins.id)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                            active
                              ? "border-brand-600 bg-bg-tertiary"
                              : "border-border-primary bg-bg-secondary hover:bg-bg-tertiary"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary">
                              <Icon name="cpu" size={16} className="text-text-quaternary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium text-text-primary">{eq?.name}</p>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-text-tertiary">
                                {eq?.code} · {eq?.location}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-xs font-medium text-text-quaternary">{formatDate(ins.scheduledAt)}</span>
                                <StatusBadge status={inspectionStatusConfig[ins.status]} />
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} className="justify-center pt-1" />
            </div>

            {/* CENTER: equipment summary + tabs */}
            <div className="space-y-4">
              {equipment && (
                <Card>
                  <div className="flex items-center gap-4 border-b border-border-secondary p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-bg-tertiary">
                      <Icon name="image" size={26} className="text-text-quaternary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">{equipment.name}</p>
                      <p className="truncate text-xs text-text-tertiary">
                        {equipment.code} · {airportName(equipment.airportId)}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge status={equipmentStatusConfig[equipment.status]} />
                      </div>
                    </div>
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-border-primary text-text-quaternary">
                      <Icon name="qr-code" size={22} />
                      <span className="text-center text-[10px] leading-tight">{t("inspections.scanQr")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
                    <Field label={t("equipment.detail.airport")} value={airportName(equipment.airportId)} />
                    <Field label={t("inspections.fieldLocation")} value={equipment.location} />
                    <Field label={t("inspections.fieldType")} value={equipment.type} />
                    <Field label={t("inspections.fieldSerialNumber")} value={equipment.serialNumber} />
                    <Field label={t("inspections.fieldInventoryNumber")} value={equipment.inventoryNumber} />
                  </div>
                </Card>
              )}

              <Tabs items={detailTabs} value={detailTab} onChange={setDetailTab} />

              {detailTab === "info" && equipment && (
                <Card>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Field label={t("equipment.detail.manufacturer")} value={equipment.manufacturer} />
                    <Field label={t("equipment.detail.model")} value={equipment.model} />
                    <Field label={t("equipment.detail.commissionedAt")} value={formatDate(equipment.commissionedAt)} />
                    <Field label={t("equipment.detail.nextInspection")} value={formatDate(equipment.nextInspectionAt)} />
                  </div>
                </Card>
              )}

              {detailTab === "history" && (
                <>
                  {lastInspection && (
                    <Card>
                      <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                        <p className="text-sm font-semibold text-text-primary">{t("inspections.lastInspection")}</p>
                        {lastInspection.result === "compliant" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-(--chip-success-border) bg-(--chip-success-bg) px-2 py-1 text-xs font-medium text-(--chip-success-text)">
                            <Icon name="check" size={12} /> {t("status.checklist.compliant")}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
                        <Field label={t("inspections.dateTime")} value={formatDate(lastInspection.completedAt ?? lastInspection.scheduledAt)} />
                        <Field label={t("inspections.fieldInspectionType")} value={typeLabel(lastInspection.type)} />
                        <Field label={t("inspections.inspector")} value={lastInspection.inspector} />
                      </div>
                      <div className="border-t border-border-secondary p-4">
                        <Button hierarchy="secondary" size="sm" className="w-full justify-center">
                          {t("inspections.openAct")}
                        </Button>
                      </div>
                    </Card>
                  )}

                  <Card>
                    <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                      <p className="text-sm font-semibold text-text-primary">{t("inspections.history")}</p>
                    </div>
                    {history && history.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-text-tertiary">{t("inspections.noHistory")}</p>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[480px] border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                                <th className="px-4 py-2.5">{t("faults.colDate")}</th>
                                <th className="px-4 py-2.5">{t("inspections.fieldInspectionType")}</th>
                                <th className="px-4 py-2.5">{t("inspections.inspector")}</th>
                                <th className="px-4 py-2.5">{t("inspections.result")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(history ?? []).slice(0, 6).map((h) => (
                                <tr key={h.id} className="border-b border-border-secondary last:border-0">
                                  <td className="px-4 py-2.5 text-text-secondary">{formatDate(h.completedAt ?? h.scheduledAt)}</td>
                                  <td className="px-4 py-2.5 text-text-secondary">{typeLabel(h.type)}</td>
                                  <td className="px-4 py-2.5 text-text-secondary">{h.inspector}</td>
                                  <td className="px-4 py-2.5">
                                    {h.result === "compliant" ? (
                                      <StatusBadge status={{ ...checklistResultConfig.compliant }} />
                                    ) : (
                                      <StatusBadge status={inspectionStatusConfig[h.status]} />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(history?.length ?? 0) > 6 && (
                          <div className="border-t border-border-secondary p-3 text-center">
                            <Button hierarchy="link-color" size="sm">
                              {t("inspections.showAll")}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </>
              )}

              {detailTab === "repairs" && (
                <Card>
                  <div className="border-b border-border-secondary px-4 py-3">
                    <p className="text-sm font-semibold text-text-primary">{t("equipment.detail.tabRepairs")}</p>
                  </div>
                  {!equipmentRepairs || equipmentRepairs.items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-text-tertiary">{t("equipment.detail.noRepairs")}</p>
                  ) : (
                    <ul className="divide-y divide-border-secondary">
                      {equipmentRepairs.items.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">{r.id}</p>
                            <p className="truncate text-xs text-text-tertiary">
                              {t("equipment.detail.engineer")} {r.engineer}
                            </p>
                          </div>
                          <StatusBadge status={repairStatusConfig[r.status]} className="shrink-0" />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {detailTab === "documents" && (
                <Card>
                  <div className="border-b border-border-secondary px-4 py-3">
                    <p className="text-sm font-semibold text-text-primary">{t("equipment.detail.tabDocuments")}</p>
                  </div>
                  {!equipmentDocuments || equipmentDocuments.items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-text-tertiary">{t("equipment.detail.noDocuments")}</p>
                  ) : (
                    <ul className="divide-y divide-border-secondary">
                      {equipmentDocuments.items.map((d) => (
                        <li key={d.id} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                          <Icon name="file-text" size={16} className="shrink-0 text-text-quaternary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-text-primary">{d.title}</p>
                            <p className="text-xs text-text-tertiary">{formatDate(d.date)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}
            </div>

            {/* RIGHT: active checklist workflow */}
            <Card className="h-fit">
              <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">{t("inspections.conductingInspection")}</p>
                {selected && <StatusBadge status={inspectionStatusConfig[selected.status]} />}
              </div>

              {selected ? (
                <>
                  <div className="space-y-3 border-b border-border-secondary p-4 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("inspections.fieldInspectionType")} value={typeLabel(selected.type)} />
                      <Field label={t("inspections.fieldRegulation")} value={selected.regulation} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary">
                        <span>
                          {t("inspections.completedOf")} {doneCount} {t("inspections.of")} {fullChecklist.length} ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                    <p className="text-xs font-medium text-text-quaternary">{t("inspections.checklistTitle")}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">{t("inspections.onlyNonCompliant")}</span>
                      <Toggle checked={onlyNonCompliant} onChange={setOnlyNonCompliant} label={t("inspections.onlyNonCompliant")} />
                    </div>
                  </div>

                  {checklistLoading ? (
                    <p className="px-4 py-6 text-center text-xs text-text-tertiary">{t("inspections.loadingChecklist")}</p>
                  ) : (
                    <ul className="max-h-96 divide-y divide-border-secondary overflow-y-auto">
                      {checklist.map((item) => {
                        const originalIndex = fullChecklist.indexOf(item);
                        return (
                          <li key={item.id} className="px-4 py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-text-secondary">
                                <span className="mr-1.5 text-text-quaternary">{originalIndex + 1}.</span>
                                {item.label}
                              </p>
                              <StatusBadge status={checklistResultConfig[item.result]} className="shrink-0" />
                            </div>
                            {item.comment && (
                              <div className="mt-1.5 pl-5">
                                <p className="text-xs text-error-400">{item.comment}</p>
                                <div className="mt-1.5 flex gap-1.5">
                                  {[0, 1].map((i) => (
                                    <div
                                      key={i}
                                      className="flex h-10 w-10 items-center justify-center rounded-md border border-border-primary bg-bg-primary text-text-quaternary"
                                    >
                                      <Icon name="image" size={14} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="space-y-2 border-t border-border-secondary p-4">
                    <p className="text-xs font-medium text-text-quaternary">{t("inspections.generalComments")}</p>
                    <textarea
                      rows={2}
                      placeholder={t("inspections.commentsPlaceholder")}
                      className="w-full resize-none rounded-md border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    <button className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-primary py-3 text-xs text-text-tertiary hover:border-brand-600 hover:text-brand-400">
                      <Icon name="camera" size={16} />
                      {t("inspections.addPhotos")}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-4 pt-0">
                    <Button hierarchy="secondary" size="sm" disabled={completing}>
                      {t("inspections.saveDraft")}
                    </Button>
                    <Button
                      hierarchy="primary"
                      size="sm"
                      onClick={handleComplete}
                      disabled={completing || selected.status === "completed"}
                    >
                      {completing ? t("inspections.completing") : t("inspections.completeInspection")}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="p-6 text-sm text-text-tertiary">{t("inspections.selectFromList")}</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-text-quaternary">{label}</p>
      <p className="font-medium text-text-primary">{value}</p>
    </div>
  );
}

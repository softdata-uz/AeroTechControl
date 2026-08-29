"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tabs } from "@/components/ui/Tabs";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { getFaultStatusConfig, getFaultPriorityConfig, faultStageOrder, getFaultStageLabels } from "@/config/faultStatus.config";
import { equipmentById, airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AddFaultModal } from "./AddFaultModal";
import type { Fault, FaultPriority, FaultStage } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useFaultsList } from "@/hooks/useFaultsList";
import { useAsync } from "@/hooks/useAsync";
import { faultsService, repairsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

const TODAY = "2026-08-25";
const PAGE_SIZE = 20;

export function FaultsClient() {
  const t = useTranslations();
  const faultStatusConfig = getFaultStatusConfig(t);
  const faultPriorityConfig = getFaultPriorityConfig(t);
  const faultStageLabels = getFaultStageLabels(t);
  const viewTabs = [
    { key: "list", label: t("faults.tabList") },
    { key: "map", label: t("faults.tabMap") },
    { key: "charts", label: t("faults.tabCharts") },
  ] as const;
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<(typeof viewTabs)[number]["key"]>("list");
  const [airportFilter, setAirportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FaultStage | "">("");
  const [priorityFilter, setPriorityFilter] = useState<FaultPriority | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [airportFilter, statusFilter, priorityFilter, search]);

  const filters = {
    airportId: airportFilter || undefined,
    stage: statusFilter || undefined,
    priority: priorityFilter || undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, loading, error, refetch } = useFaultsList(filters);
  const faults = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  // KPI cards reflect overall operational state, independent of table filters/pagination.
  const { data: allFaultsPage, refetch: refetchKpiFaults } = useAsync(
    () => faultsService.listFaults({ pageSize: 1000 }),
    []
  );
  const { data: waitingPartsPage } = useAsync(
    () => repairsService.listRepairs({ status: "waiting_parts", pageSize: 1000 }),
    []
  );

  const kpi = useMemo(() => {
    const allFaults = allFaultsPage?.items ?? [];
    const total = allFaults.length;
    const open = allFaults.filter((f) => f.stage === "detected" || f.stage === "registered").length;
    const inProgress = allFaults.filter((f) => f.stage === "diagnosis" || f.stage === "repair").length;
    const waitingParts = waitingPartsPage?.total ?? 0;
    const resolved = allFaults.filter((f) => f.stage === "verification").length;
    const closed = allFaults.filter((f) => f.stage === "closed").length;
    const overdue = allFaults.filter((f) => f.dueAt && f.dueAt < TODAY && f.stage !== "closed").length;
    return { total, open, inProgress, waitingParts, resolved, closed, overdue };
  }, [allFaultsPage, waitingPartsPage]);

  // Keep a valid selection whenever the visible page of faults changes.
  useEffect(() => {
    if (faults.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!faults.some((f) => f.id === selectedId)) {
      setSelectedId(faults[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faults]);

  const selected = faults.find((f) => f.id === selectedId) ?? null;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFaultCreated(fault: Fault) {
    refetch();
    refetchKpiFaults();
    setSelectedId(fault.id);
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={t("faults.title")}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              {t("common.export")}
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm" onClick={() => setAddOpen(true)}>
              {t("faults.newFault")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4 xl:grid-cols-7">
        <KPICard label={t("faults.kpiTotal")} value={kpi.total} icon="layers" tone="neutral" />
        <KPICard label={t("faults.kpiOpen")} value={kpi.open} icon="alert-triangle" tone="error" />
        <KPICard label={t("faults.kpiInProgress")} value={kpi.inProgress} icon="wrench" tone="warning" />
        <KPICard label={t("faults.kpiWaitingParts")} value={kpi.waitingParts} icon="package" tone="brand" />
        <KPICard label={t("faults.kpiResolved")} value={kpi.resolved} icon="check-circle" tone="success" />
        <KPICard label={t("faults.kpiClosed")} value={kpi.closed} icon="check-circle" tone="success" />
        <KPICard label={t("faults.kpiOverdue")} value={kpi.overdue} icon="clock" tone="error" />
      </div>

      <Tabs items={viewTabs} value={view} onChange={setView} className="mt-5 px-6" />

      {view !== "list" ? (
        <div className="mx-6 mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-secondary py-16 text-text-tertiary">
          <Icon name="layers" size={24} />
          <p className="text-sm">
            {viewTabs.find((v) => v.key === view)?.label ?? ""} {t("faults.comingSoonSuffix")}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border-primary bg-bg-secondary px-6 py-3">
            <Dropdown
              className="w-56"
              placeholder={t("common.allAirports")}
              value={airportFilter}
              onChange={setAirportFilter}
              options={airports.map((a) => ({ value: a.id, label: a.city }))}
            />
            <Dropdown className="w-56" placeholder={t("common.allTerminals")} value="" onChange={() => {}} options={[]} />
            <Dropdown className="w-56" placeholder={t("common.allTypes")} value="" onChange={() => {}} options={[]} />
            <Dropdown
              className="w-56"
              placeholder={t("common.allStatuses")}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as FaultStage | "")}
              options={faultStageOrder.map((stage) => ({ value: stage, label: faultStageLabels[stage] }))}
            />
            <Dropdown
              className="w-56"
              placeholder={t("common.allPriorities")}
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as FaultPriority | "")}
              options={Object.entries(faultPriorityConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            />
            <div className="flex-1" />
            <Input
              icon="search"
              placeholder={t("faults.searchPlaceholder")}
              className="w-72"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button hierarchy="secondary" icon="filter" size="sm">
              {t("common.filters")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
              {error ? (
                <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                  <p className="text-sm text-text-secondary">{t("faults.loadError")}</p>
                  <p className="text-xs text-text-tertiary">{error}</p>
                  <Button hierarchy="secondary" size="sm" onClick={refetch}>
                    {t("common.retry")}
                  </Button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
                  {t("faults.loading")}
                </div>
              ) : faults.length === 0 ? (
                <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                  <p className="text-sm text-text-secondary">{t("faults.notFound")}</p>
                  <p className="text-xs text-text-tertiary">{t("faults.changeFilters")}</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                      <th className="px-4 py-2.5">{t("faults.colId")}</th>
                      <th className="px-4 py-2.5">{t("faults.colEquipment")}</th>
                      <th className="px-4 py-2.5">{t("faults.colFault")}</th>
                      <th className="px-4 py-2.5">{t("faults.colStatus")}</th>
                      <th className="px-4 py-2.5">{t("faults.colPriority")}</th>
                      <th className="px-4 py-2.5">{t("faults.colDate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faults.map((f) => {
                      const eq = equipmentById(f.equipmentId);
                      const active = f.id === selectedId;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedId(f.id)}
                          className={cn(
                            "cursor-pointer border-b border-border-secondary transition-colors last:border-0",
                            active ? "bg-bg-tertiary" : "hover:bg-bg-tertiary"
                          )}
                        >
                          <td className="px-4 py-2.5 font-medium text-error-400">{f.id}</td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-text-primary">{eq?.name}</p>
                            <p className="text-xs text-text-tertiary">{eq?.code}</p>
                          </td>
                          <td className="max-w-[260px] truncate px-4 py-2.5 text-text-secondary">{f.title}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={faultStatusConfig[f.stage]} />
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={faultPriorityConfig[f.priority]} />
                          </td>
                          <td className="px-4 py-2.5 text-text-secondary">{formatDate(f.detectedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
              <div className="flex items-center justify-between border-t border-border-primary px-4 py-3 text-xs text-text-tertiary">
                <span>{t("common.showingPerPage")} {PAGE_SIZE}</span>
                <div className="flex items-center gap-3">
                  <span>
                    {rangeStart}–{rangeEnd} {t("common.of")} {total} {t("common.records")}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      hierarchy="secondary"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      hierarchy="secondary"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <FaultDetailPanel fault={selected} t={t} faultStatusConfig={faultStatusConfig} faultPriorityConfig={faultPriorityConfig} />
          </div>
        </>
      )}

      <AddFaultModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleFaultCreated} />
    </div>
  );
}

function FaultDetailPanel({
  fault,
  t,
  faultStatusConfig,
  faultPriorityConfig,
}: {
  fault: Fault | null;
  t: (key: import("@/lib/i18n/translations").TranslationKey) => string;
  faultStatusConfig: ReturnType<typeof getFaultStatusConfig>;
  faultPriorityConfig: ReturnType<typeof getFaultPriorityConfig>;
}) {
  if (!fault) {
    return (
      <Card className="flex items-center justify-center p-10 text-sm text-text-tertiary">
        {t("faults.selectFromList")}
      </Card>
    );
  }

  const eq = equipmentById(fault.equipmentId);

  return (
    <Card className="h-fit">
      <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{t("faults.detailTitle")}</p>
          <p className="text-xs text-text-tertiary">
            {fault.id} · {formatDate(fault.detectedAt)}
          </p>
        </div>
        <StatusBadge status={faultStatusConfig[fault.stage]} />
      </div>

      <div className="space-y-4 p-4 text-sm">
        {eq && (
          <Link
            href={`/equipment/${eq.id}`}
            className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-primary p-3 transition-colors hover:border-brand-600"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary">
              <Icon name="cpu" size={18} className="text-text-tertiary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{eq.name}</p>
              <p className="truncate text-xs text-text-tertiary">
                {eq.code} · {airportName(eq.airportId)}
              </p>
            </div>
          </Link>
        )}

        <div>
          <p className="mb-1 text-xs font-medium text-text-quaternary">{t("faults.description")}</p>
          <p className="text-text-secondary">{fault.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("faults.priority")}>
            <StatusBadge status={faultPriorityConfig[fault.priority]} />
          </Field>
          <Field label={t("faults.category")} value={t(fault.category as TranslationKey)} />
          <Field label={t("faults.reportedBy")} value={fault.reportedBy} />
          <Field label={t("faults.assignee")} value={fault.assignee ?? "—"} />
          <Field label={t("faults.dueDate")} value={formatDate(fault.dueAt)} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-text-quaternary">{t("faults.filesAndPhotos")}</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex h-14 w-14 items-center justify-center rounded-md border border-border-primary bg-bg-primary text-text-quaternary"
              >
                <Icon name="image" size={18} />
              </div>
            ))}
            <button className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border-primary text-text-quaternary hover:border-brand-600 hover:text-brand-400">
              <Icon name="upload" size={16} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-text-quaternary">{label}</p>
      {children ?? <p className="font-medium text-text-primary">{value}</p>}
    </div>
  );
}

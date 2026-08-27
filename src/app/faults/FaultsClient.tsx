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
import { faultStatusConfig, faultPriorityConfig, faultStageOrder, faultStageLabels } from "@/config/faultStatus.config";
import { equipmentById, airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AddFaultModal } from "./AddFaultModal";
import type { Fault, FaultPriority, FaultStage } from "@/lib/types";
import { useFaultsList } from "@/hooks/useFaultsList";
import { useAsync } from "@/hooks/useAsync";
import { faultsService, repairsService } from "@/services";

const TODAY = "2026-08-25";
const PAGE_SIZE = 20;

const viewTabs = [
  { key: "list", label: "Список неисправностей" },
  { key: "map", label: "Карта неисправностей" },
  { key: "charts", label: "Диаграммы" },
] as const;

export function FaultsClient() {
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
        title="Неисправности"
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              Экспорт
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm" onClick={() => setAddOpen(true)}>
              Новая неисправность
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4 xl:grid-cols-7">
        <KPICard label="Всего неисправностей" value={kpi.total} icon="layers" tone="neutral" />
        <KPICard label="Открытые" value={kpi.open} icon="alert-triangle" tone="error" />
        <KPICard label="В работе" value={kpi.inProgress} icon="wrench" tone="warning" />
        <KPICard label="Ожидают ЗИП" value={kpi.waitingParts} icon="package" tone="brand" />
        <KPICard label="Устранены" value={kpi.resolved} icon="check-circle" tone="success" />
        <KPICard label="Закрытые" value={kpi.closed} icon="check-circle" tone="success" />
        <KPICard label="Просроченные" value={kpi.overdue} icon="clock" tone="error" />
      </div>

      <Tabs items={viewTabs} value={view} onChange={setView} className="mt-5 px-6" />

      {view !== "list" ? (
        <div className="mx-6 mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-secondary py-16 text-text-tertiary">
          <Icon name="layers" size={24} />
          <p className="text-sm">
            {viewTabs.find((v) => v.key === view)?.label ?? ""} появится в следующей фазе
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-border-primary bg-bg-secondary px-6 py-3">
            <Dropdown
              className="w-40"
              placeholder="Все аэропорты"
              value={airportFilter}
              onChange={setAirportFilter}
              options={airports.map((a) => ({ value: a.id, label: a.city }))}
            />
            <Dropdown className="w-40" placeholder="Все терминалы" value="" onChange={() => {}} options={[]} />
            <Dropdown className="w-48" placeholder="Все типы оборудования" value="" onChange={() => {}} options={[]} />
            <Dropdown
              className="w-40"
              placeholder="Все статусы"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as FaultStage | "")}
              options={faultStageOrder.map((stage) => ({ value: stage, label: faultStageLabels[stage] }))}
            />
            <Dropdown
              className="w-40"
              placeholder="Все приоритеты"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as FaultPriority | "")}
              options={Object.entries(faultPriorityConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            />
            <div className="flex-1" />
            <Input
              icon="search"
              placeholder="Поиск по оборудованию, неисправности, ID..."
              className="w-72"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button hierarchy="secondary" icon="filter" size="sm">
              Фильтры
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
              {error ? (
                <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                  <p className="text-sm text-text-secondary">Не удалось загрузить неисправности.</p>
                  <p className="text-xs text-text-tertiary">{error}</p>
                  <Button hierarchy="secondary" size="sm" onClick={refetch}>
                    Повторить
                  </Button>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
                  Загрузка неисправностей…
                </div>
              ) : faults.length === 0 ? (
                <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
                  <p className="text-sm text-text-secondary">Неисправности не найдены.</p>
                  <p className="text-xs text-text-tertiary">Измените параметры поиска или фильтры.</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Оборудование</th>
                      <th className="px-4 py-2.5">Неисправность</th>
                      <th className="px-4 py-2.5">Статус</th>
                      <th className="px-4 py-2.5">Приоритет</th>
                      <th className="px-4 py-2.5">Дата создания</th>
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
                <span>Показывать по: {PAGE_SIZE}</span>
                <div className="flex items-center gap-3">
                  <span>
                    {rangeStart}–{rangeEnd} из {total} записей
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      hierarchy="secondary"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Назад
                    </Button>
                    <Button
                      hierarchy="secondary"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Далее
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <FaultDetailPanel fault={selected} />
          </div>
        </>
      )}

      <AddFaultModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleFaultCreated} />
    </div>
  );
}

function FaultDetailPanel({ fault }: { fault: Fault | null }) {
  if (!fault) {
    return (
      <Card className="flex items-center justify-center p-10 text-sm text-text-tertiary">
        Выберите неисправность из списка
      </Card>
    );
  }

  const eq = equipmentById(fault.equipmentId);
  const currentStageIndex = faultStageOrder.indexOf(fault.stage);

  return (
    <Card className="h-fit">
      <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Детали неисправности</p>
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
          <p className="mb-1 text-xs font-medium text-text-quaternary">Описание неисправности</p>
          <p className="text-text-secondary">{fault.description}</p>
        </div>

        {/* Lifecycle */}
        <div>
          <p className="mb-2 text-xs font-medium text-text-quaternary">Жизненный цикл</p>
          <div className="flex flex-wrap items-center gap-1">
            {faultStageOrder.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    i <= currentStageIndex
                      ? "bg-brand-600 text-white"
                      : "bg-bg-tertiary text-text-quaternary"
                  )}
                >
                  {faultStageLabels[stage]}
                </span>
                {i < faultStageOrder.length - 1 && (
                  <Icon name="chevron-right" size={12} className="text-text-quaternary" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Приоритет">
            <StatusBadge status={faultPriorityConfig[fault.priority]} />
          </Field>
          <Field label="Категория" value={fault.category} />
          <Field label="Выявил" value={fault.reportedBy} />
          <Field label="Назначен на" value={fault.assignee ?? "—"} />
          <Field label="Плановая дата устранения" value={formatDate(fault.dueAt)} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-text-quaternary">Файлы и фото</p>
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

      <div className="space-y-2 border-t border-border-secondary p-4">
        <p className="mb-1 text-xs font-medium text-text-quaternary">Действия</p>
        <Button hierarchy="primary" className="w-full justify-center" size="sm">
          Назначить исполнителя
        </Button>
        <Button hierarchy="secondary" className="w-full justify-center" size="sm">
          Создать заказ на ЗИП
        </Button>
        <Button hierarchy="destructive" className="w-full justify-center" size="sm">
          Закрыть неисправность
        </Button>
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

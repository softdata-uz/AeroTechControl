"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tabs } from "@/components/ui/Tabs";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { inspectionStatusConfig, checklistResultConfig } from "@/config/inspectionStatus.config";
import { equipmentStatusConfig } from "@/config/equipmentStatus.config";
import { equipmentById, airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { InspectionStatus } from "@/lib/types";
import { useInspectionsList } from "@/hooks/useInspectionsList";
import { useAsync } from "@/hooks/useAsync";
import { inspectionsService } from "@/services";

const TODAY = "2026-08-25";

const viewTabs = [
  { key: "inspections", label: "Проверки" },
  { key: "maintenance", label: "ТО" },
] as const;

export function InspectionsClient() {
  const [view, setView] = useState<(typeof viewTabs)[number]["key"]>("inspections");
  const [airportFilter, setAirportFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

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

  const {
    data: inspectionsPage,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useInspectionsList(filters);
  const inspections = useMemo(() => inspectionsPage?.items ?? [], [inspectionsPage]);

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
    const overdue = all.filter(
      (i) => i.status === "overdue" || (i.status === "planned" && i.scheduledAt < TODAY)
    ).length;
    const requiresAttention = all.filter((i) => i.status === "requires_review").length;
    return { total, completed, planned, overdue, requiresAttention };
  }, [allInspectionsPage]);

  // Keep a valid selection whenever the visible list changes.
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

  const selected = inspections.find((i) => i.id === selectedId) ?? null;
  const equipment = selected ? equipmentById(selected.equipmentId) : null;

  const { data: history } = useAsync(
    () => (equipment ? inspectionsService.listInspectionsForEquipment(equipment.id) : Promise.resolve([])),
    [equipment?.id]
  );

  const {
    data: checklistData,
    loading: checklistLoading,
    refetch: refetchChecklist,
  } = useAsync(
    () => (selected ? inspectionsService.getInspectionChecklist(selected.id) : Promise.resolve([])),
    [selected?.id]
  );
  const checklist = checklistData ?? [];
  const doneCount = checklist.filter((c) => c.result !== "pending").length;
  const progressPct = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  async function handleComplete() {
    if (!selected) return;
    const result = checklist.some((c) => c.result === "non_compliant") ? "non_compliant" : "compliant";
    setCompleting(true);
    try {
      await inspectionsService.completeInspection(selected.id, result);
      await Promise.all([refetchList(), refetchKpi(), refetchChecklist()]);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Проверки и ТО"
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              Экспорт
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm">
              Новая проверка
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-5">
        <KPICard label="Всего проверок" value={kpi.total} meta="за период" icon="clipboard-check" tone="brand" />
        <KPICard
          label="Выполнено"
          value={kpi.completed}
          meta={`${kpi.total ? Math.round((kpi.completed / kpi.total) * 100) : 0}%`}
          icon="check-circle"
          tone="success"
        />
        <KPICard
          label="Запланировано"
          value={kpi.planned}
          meta={`${kpi.total ? Math.round((kpi.planned / kpi.total) * 100) : 0}%`}
          icon="clock"
          tone="warning"
        />
        <KPICard
          label="Просрочено"
          value={kpi.overdue}
          meta={`${kpi.total ? Math.round((kpi.overdue / kpi.total) * 100) : 0}%`}
          icon="alert-triangle"
          tone="error"
        />
        <KPICard label="Требуют внимания" value={kpi.requiresAttention} meta="оборудования" icon="gauge" tone="purple" />
      </div>

      <Tabs items={viewTabs} value={view} onChange={setView} className="mt-5 px-6" />

      {view === "maintenance" ? (
        <div className="mx-6 mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-border-primary bg-bg-secondary py-16 text-text-tertiary">
          <Icon name="wrench" size={24} />
          <p className="text-sm">Модуль ТО появится в следующей фазе</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-6 pt-4 2xl:grid-cols-[320px_1fr_360px]">
          {/* LEFT: inspection list */}
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <Dropdown
                className="w-full"
                placeholder="Все аэропорты"
                value={airportFilter}
                onChange={setAirportFilter}
                options={airports.map((a) => ({ value: a.id, label: a.city }))}
              />
              <Dropdown className="w-full" placeholder="Все типы оборудования" value="" onChange={() => {}} options={[]} />
              <Dropdown
                className="w-full"
                placeholder="Все статусы"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as InspectionStatus | "")}
                options={Object.entries(inspectionStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
              />
              <Input
                icon="search"
                placeholder="Поиск по оборудованию, ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <p className="px-1 text-xs text-text-tertiary">Всего: {inspections.length}</p>
            {listError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-center">
                <p className="text-xs text-text-secondary">Не удалось загрузить проверки.</p>
                <Button hierarchy="secondary" size="sm" onClick={refetchList}>
                  Повторить
                </Button>
              </div>
            ) : listLoading ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-xs text-text-tertiary">
                Загрузка…
              </div>
            ) : inspections.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-border-primary bg-bg-secondary px-3 py-8 text-center">
                <p className="text-xs text-text-secondary">Проверки не найдены.</p>
                <p className="text-xs text-text-tertiary">Измените параметры поиска или фильтры.</p>
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-text-primary">{eq?.name}</p>
                          <StatusBadge status={inspectionStatusConfig[ins.status]} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-text-tertiary">
                          {eq?.code} · {eq?.location}
                        </p>
                        <p className="mt-1 text-xs font-medium text-text-quaternary">
                          {formatDate(ins.scheduledAt)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* CENTER: equipment summary + history */}
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
                    <span className="text-xs">QR / NFC</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
                  <Field label="Тип оборудования" value={equipment.type} />
                  <Field label="Место установки" value={equipment.location} />
                  <Field label="Серийный номер" value={equipment.serialNumber} />
                  <Field label="Инвентарный номер" value={equipment.inventoryNumber} />
                </div>
              </Card>
            )}

            <Card>
              <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">История проверок</p>
              </div>
              {history && history.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-text-tertiary">История проверок отсутствует.</p>
              ) : (
                <ul className="max-h-80 divide-y divide-border-secondary overflow-y-auto">
                  {(history ?? []).map((h) => (
                    <li key={h.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-text-primary">{formatDate(h.completedAt ?? h.scheduledAt)}</p>
                        <p className="text-xs text-text-tertiary">
                          {h.type === "periodic" ? "Периодическая" : h.type === "unscheduled" ? "Внеплановая" : "После ремонта"} · {h.inspector}
                        </p>
                      </div>
                      <StatusBadge status={inspectionStatusConfig[h.status]} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* RIGHT: active checklist workflow */}
          <Card className="h-fit">
            <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">Проведение проверки</p>
              {selected && <StatusBadge status={inspectionStatusConfig[selected.status]} />}
            </div>

            {selected ? (
              <>
                <div className="space-y-3 border-b border-border-secondary p-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Тип проверки"
                      value={
                        selected.type === "periodic"
                          ? "Периодическая"
                          : selected.type === "unscheduled"
                          ? "Внеплановая"
                          : "После ремонта"
                      }
                    />
                    <Field label="Регламент" value={selected.regulation} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary">
                      <span>
                        Выполнено: {doneCount} из {checklist.length}
                      </span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                {checklistLoading ? (
                  <p className="px-4 py-6 text-center text-xs text-text-tertiary">Загрузка чек-листа…</p>
                ) : (
                  <ul className="max-h-96 divide-y divide-border-secondary overflow-y-auto">
                    {checklist.map((item, i) => (
                      <li key={item.id} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-text-secondary">
                            <span className="mr-1.5 text-text-quaternary">{i + 1}.</span>
                            {item.label}
                          </p>
                          <StatusBadge status={checklistResultConfig[item.result]} className="shrink-0" />
                        </div>
                        {item.comment && (
                          <p className="mt-1 pl-5 text-xs text-error-400">{item.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-2 border-t border-border-secondary p-4">
                  <p className="text-xs font-medium text-text-quaternary">Общие замечания</p>
                  <textarea
                    rows={2}
                    placeholder="Введите текст..."
                    className="w-full resize-none rounded-md border border-border-primary bg-bg-primary p-2.5 text-sm text-text-primary placeholder:text-text-placeholder outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-primary py-3 text-xs text-text-tertiary hover:border-brand-600 hover:text-brand-400">
                    <Icon name="camera" size={16} />
                    Добавить фотографии
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 pt-0">
                  <Button hierarchy="secondary" size="sm" disabled={completing}>
                    Сохранить черновик
                  </Button>
                  <Button
                    hierarchy="primary"
                    size="sm"
                    onClick={handleComplete}
                    disabled={completing || selected.status === "completed"}
                  >
                    {completing ? "Завершение…" : "Завершить проверку"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="p-6 text-sm text-text-tertiary">Выберите проверку из списка слева</p>
            )}
          </Card>
        </div>
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

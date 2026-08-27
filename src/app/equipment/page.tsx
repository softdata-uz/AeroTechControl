"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { airports } from "@/lib/mock-data";
import { equipmentStatusConfig } from "@/config/equipmentStatus.config";
import type { EquipmentStatus } from "@/lib/types";
import { useEquipmentList } from "@/hooks/useEquipmentList";
import { useAsync } from "@/hooks/useAsync";
import { equipmentService } from "@/services";

const PAGE_SIZE = 20;

export default function EquipmentRegistryPage() {
  const router = useRouter();
  const [airportFilter, setAirportFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce free-text search so we don't re-query on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Filters changed -> back to page 1.
  useEffect(() => {
    setPage(1);
  }, [airportFilter, typeFilter, statusFilter, search]);

  const { data: typesData } = useAsync(() => equipmentService.listEquipmentTypes(), []);
  const equipmentTypes = typesData ?? [];

  const { data, loading, error, refetch } = useEquipmentList({
    airportId: airportFilter || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="pb-8">
      <PageHeader
        title="Реестр оборудования"
        context={`Всего записей: ${total}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              Экспорт
            </Button>
            <Button hierarchy="secondary" icon="printer" size="sm">
              Печать
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm" onClick={() => router.push("/equipment/new")}>
              Добавить оборудование
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border-primary bg-bg-secondary px-6 py-3">
        <Dropdown
          className="w-44"
          placeholder="Все аэропорты"
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: a.id, label: a.city }))}
        />
        <Dropdown
          className="w-48"
          placeholder="Все типы оборудования"
          value={typeFilter}
          onChange={setTypeFilter}
          options={equipmentTypes.map((t) => ({ value: t, label: t }))}
        />
        <Dropdown
          className="w-44"
          placeholder="Все статусы"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as EquipmentStatus | "")}
          options={Object.entries(equipmentStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder="Поиск..."
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button hierarchy="secondary" icon="filter" size="sm">
          Фильтры
        </Button>
      </div>

      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Не удалось загрузить реестр оборудования.</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                Повторить
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              Загрузка оборудования…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Оборудование не найдено.</p>
              <p className="text-xs text-text-tertiary">Измените параметры поиска или фильтры.</p>
            </div>
          ) : (
            <EquipmentTable items={items} />
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
      </div>
    </div>
  );
}

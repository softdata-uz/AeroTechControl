"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon } from "@/components/icons";
import { roleLabels, airportName, airports } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useUsersList } from "@/hooks/useUsersList";
import { useAsync } from "@/hooks/useAsync";
import { usersService } from "@/services";

const roleChipClass: Record<UserRole, string> = {
  administrator: "bg-(--chip-brand-bg) text-(--chip-brand-text) border-(--chip-brand-border)",
  lead_engineer: "bg-(--chip-purple-bg) text-(--chip-purple-text) border-(--chip-purple-border)",
  engineer: "bg-(--chip-gray-bg) text-(--chip-gray-text) border-(--chip-gray-border)",
  spare_parts_manager: "bg-(--chip-warning-bg) text-(--chip-warning-text) border-(--chip-warning-border)",
  central_office: "bg-(--chip-success-bg) text-(--chip-success-text) border-(--chip-success-border)",
  auditor: "bg-(--chip-gray-bg) text-(--chip-gray-text) border-(--chip-gray-border)",
};

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [airportFilter, setAirportFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    role: roleFilter || undefined,
    airportId: airportFilter || undefined,
    search: search || undefined,
    pageSize: 100,
  };

  const { data, loading, error, refetch } = useUsersList(filters);
  const users = useMemo(() => data?.items ?? [], [data]);

  // KPI cards reflect the full user base, independent of the table filters.
  const { data: allUsersPage, refetch: refetchKpi } = useAsync(
    () => usersService.listUsers({ pageSize: 1000 }),
    []
  );
  const kpi = useMemo(() => {
    const all = allUsersPage?.items ?? [];
    const total = all.length;
    const active = all.filter((u) => u.active).length;
    const admins = all.filter((u) => u.role === "administrator").length;
    return { total, active, admins, inactive: total - active };
  }, [allUsersPage]);

  async function handleToggleActive(id: string, active: boolean) {
    setTogglingId(id);
    try {
      await usersService.setUserActive(id, active);
      await Promise.all([refetch(), refetchKpi()]);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Пользователи"
        context={`Всего пользователей: ${kpi.total}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm">
              Экспорт
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm">
              Пригласить пользователя
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label="Всего" value={kpi.total} icon="users" tone="neutral" />
        <KPICard label="Активные" value={kpi.active} icon="check-circle" tone="success" />
        <KPICard label="Неактивные" value={kpi.inactive} icon="clock" tone="warning" />
        <KPICard label="Администраторы" value={kpi.admins} icon="shield" tone="brand" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
        <Dropdown
          className="w-44"
          placeholder="Все роли"
          value={roleFilter}
          onChange={(value) => setRoleFilter(value as UserRole | "")}
          options={Object.entries(roleLabels).map(([key, label]) => ({ value: key, label }))}
        />
        <Dropdown
          className="w-44"
          placeholder="Все аэропорты"
          value={airportFilter}
          onChange={setAirportFilter}
          options={airports.map((a) => ({ value: a.id, label: a.city }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder="Поиск по имени, email..."
          className="w-64"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="px-6 pt-4">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Не удалось загрузить пользователей.</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                Повторить
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              Загрузка пользователей…
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">Пользователи не найдены.</p>
              <p className="text-xs text-text-tertiary">Измените параметры поиска или фильтры.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">Пользователь</th>
                  <th className="px-4 py-2.5">Роль</th>
                  <th className="px-4 py-2.5">Аэропорт</th>
                  <th className="px-4 py-2.5">Активность</th>
                  <th className="px-4 py-2.5">Статус</th>
                  <th className="px-4 py-2.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = u.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">{u.fullName}</p>
                            <p className="truncate text-xs text-text-tertiary">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            roleChipClass[u.role]
                          )}
                        >
                          {roleLabels[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">
                        {u.airportId ? airportName(u.airportId) : "Все аэропорты"}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatDate(u.lastActiveAt)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                            u.active
                              ? "border-(--chip-success-border) bg-(--chip-success-bg) text-(--chip-success-text)"
                              : "border-(--chip-gray-border) bg-(--chip-gray-bg) text-(--chip-gray-text)"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", u.active ? "bg-success-500" : "bg-gray-500")} />
                          {u.active ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label="Редактировать"
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            aria-label={u.active ? "Деактивировать" : "Активировать"}
                            title={u.active ? "Деактивировать" : "Активировать"}
                            onClick={() => handleToggleActive(u.id, !u.active)}
                            disabled={togglingId === u.id}
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary disabled:opacity-40"
                          >
                            <Icon name={u.active ? "log-out" : "check-circle"} size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

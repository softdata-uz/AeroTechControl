"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/icons";
import { useRole } from "@/lib/role-context";
import { useTheme } from "@/lib/theme-context";
import { roleLabels } from "@/lib/mock-data";
import { roleDescriptions } from "@/config/roleAccess.config";
import { useDirectorySummary } from "@/hooks/useDirectorySummary";
import { settingsService } from "@/services";
import type { NotificationPreferences } from "@/services/settings.service";
import type { UserRole } from "@/lib/types";
import type { Theme } from "@/lib/theme-context";
import { cn } from "@/lib/cn";

const roleOrder: UserRole[] = [
  "administrator",
  "lead_engineer",
  "engineer",
  "spare_parts_manager",
  "central_office",
  "auditor",
];

export default function SettingsPage() {
  const { role, setRole, user } = useRole();
  const { theme, setTheme } = useTheme();
  const { data: directorySummary, loading: directoryLoading } = useDirectorySummary();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  useEffect(() => {
    settingsService.getNotificationPreferences().then(setPreferences);
  }, []);

  function handlePreferenceChange(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSavingKey(key);
    settingsService.updateNotificationPreferences({ [key]: value }).finally(() => setSavingKey(null));
  }

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="pb-8">
      <PageHeader title="Настройки" context="Профиль, ролевой доступ, уведомления, справочники" />

      <div className="grid grid-cols-1 gap-4 px-6 pt-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{user.fullName}</p>
              <p className="truncate text-xs text-text-tertiary">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-brand-400">{roleLabels[user.role]}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Внешний вид</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2 p-4">
            <ThemeOption
              value="dark"
              active={theme === "dark"}
              onSelect={setTheme}
              label="Тёмная"
              description="По умолчанию, для операторской"
              icon="moon"
            />
            <ThemeOption
              value="light"
              active={theme === "light"}
              onSelect={setTheme}
              label="Светлая"
              description="Для дневного офисного режима"
              icon="sun"
            />
          </div>
        </Card>
      </div>

      <div className="px-6 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ролевая симуляция интерфейса</CardTitle>
          </CardHeader>
          <p className="border-b border-border-secondary px-4 py-3 text-xs text-text-tertiary">
            Только для интерфейсной демонстрации — переключение роли меняет видимую навигацию, а не
            реальные права доступа.
          </p>
          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {roleOrder.map((r) => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-brand-600 bg-bg-tertiary"
                      : "border-border-primary bg-bg-primary hover:bg-bg-tertiary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{roleLabels[r]}</span>
                    {active && <Icon name="check-circle" size={16} className="text-brand-400" />}
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">{roleDescriptions[r]}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="px-6 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
          </CardHeader>
          {!preferences ? (
            <p className="px-4 py-6 text-sm text-text-tertiary">Загрузка настроек…</p>
          ) : (
            <div className="divide-y divide-border-secondary">
              <NotificationRow
                label="Email-уведомления"
                description="Критические неисправности, просроченные проверки"
                checked={preferences.email}
                saving={savingKey === "email"}
                onChange={(v) => handlePreferenceChange("email", v)}
              />
              <NotificationRow
                label="Push-уведомления"
                description="Мгновенные оповещения в браузере"
                checked={preferences.push}
                saving={savingKey === "push"}
                onChange={(v) => handlePreferenceChange("push", v)}
              />
              <NotificationRow
                label="SMS-уведомления"
                description="Только критические инциденты"
                checked={preferences.sms}
                saving={savingKey === "sms"}
                onChange={(v) => handlePreferenceChange("sms", v)}
              />
            </div>
          )}
        </Card>
      </div>

      <div className="px-6 pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Справочники</CardTitle>
          </CardHeader>
          {directoryLoading || !directorySummary ? (
            <p className="px-4 py-6 text-sm text-text-tertiary">Загрузка справочников…</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <DirectoryTile icon="map-pin" label="Аэропорты" count={directorySummary.airports} />
              <DirectoryTile icon="building" label="Терминалы" count={directorySummary.terminals} />
              <DirectoryTile icon="layers" label="Зоны" count={directorySummary.zones} />
              <DirectoryTile icon="cpu" label="Типы оборудования" count={directorySummary.equipmentTypes} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function NotificationRow({
  label,
  description,
  checked,
  saving,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  saving?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {saving && <span className="text-xs text-text-quaternary">Сохранение…</span>}
        <Toggle checked={checked} onChange={onChange} label={label} disabled={saving} />
      </div>
    </div>
  );
}

function ThemeOption({
  value,
  active,
  onSelect,
  label,
  description,
  icon,
}: {
  value: Theme;
  active: boolean;
  onSelect: (v: Theme) => void;
  label: string;
  description: string;
  icon: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        active ? "border-brand-600 bg-bg-tertiary" : "border-border-primary bg-bg-primary hover:bg-bg-tertiary"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-(--chip-brand-bg) text-(--chip-brand-text)" : "bg-(--chip-gray-bg) text-(--chip-gray-text)"
        )}
      >
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          {active && <Icon name="check-circle" size={14} className="text-brand-400" />}
        </div>
        <p className="truncate text-xs text-text-tertiary">{description}</p>
      </div>
    </button>
  );
}

function DirectoryTile({
  icon,
  label,
  count,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-lg border border-border-primary bg-bg-primary p-3">
      <Icon name={icon} size={18} className="text-text-quaternary" />
      <p className="mt-2 text-lg font-semibold text-text-primary">{count}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  );
}

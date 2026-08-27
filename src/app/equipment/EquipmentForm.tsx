"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { airports, terminalsByAirport, zonesByTerminal, equipment } from "@/lib/mock-data";
import { equipmentStatusConfig } from "@/config/equipmentStatus.config";
import type { Equipment, EquipmentStatus } from "@/lib/types";

interface Props {
  mode: "add" | "edit";
  initial?: Equipment;
  onSubmit: (equipment: Equipment) => void;
  onCancel: () => void;
}

/**
 * 11 fields — per pickFormLayout() (src/lib/form-layout.ts) that's a
 * dedicated-page form, not a Modal/Drawer. Rendered by
 * /equipment/new and /equipment/[id]/edit; no Modal/Drawer chrome here.
 */
export const EQUIPMENT_FORM_FIELD_COUNT = 11;

type FormState = {
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  inventoryNumber: string;
  airportId: string;
  terminalId: string;
  zoneId: string;
  status: EquipmentStatus;
  commissionedAt: string | null;
};

function formFromEquipment(eq: Equipment): FormState {
  return {
    name: eq.name,
    type: eq.type,
    manufacturer: eq.manufacturer,
    model: eq.model,
    serialNumber: eq.serialNumber,
    inventoryNumber: eq.inventoryNumber,
    airportId: eq.airportId,
    terminalId: eq.terminalId,
    zoneId: eq.zoneId,
    status: eq.status,
    commissionedAt: eq.commissionedAt,
  };
}

const emptyForm: FormState = {
  name: "",
  type: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  inventoryNumber: "",
  airportId: "",
  terminalId: "",
  zoneId: "",
  status: "operational",
  commissionedAt: null,
};

const statusOptions = Object.entries(equipmentStatusConfig).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

export function EquipmentForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => (initial ? formFromEquipment(initial) : emptyForm));
  const [error, setError] = useState<string | null>(null);

  const airportOptions = airports.map((a) => ({ value: a.id, label: a.city }));
  const terminalOptions = form.airportId ? terminalsByAirport(form.airportId).map((t) => ({ value: t.id, label: t.name })) : [];
  const zoneOptions = form.terminalId ? zonesByTerminal(form.terminalId).map((z) => ({ value: z.id, label: z.name })) : [];

  function handleSubmit() {
    if (!form.name || !form.type || !form.airportId || !form.terminalId || !form.zoneId) {
      setError("Заполните обязательные поля: наименование, тип, аэропорт, терминал, зона.");
      return;
    }
    const zone = zonesByTerminal(form.terminalId).find((z) => z.id === form.zoneId);

    if (mode === "edit" && initial) {
      onSubmit({
        ...initial,
        ...form,
        location: zone?.name ?? initial.location,
        commissionedAt: form.commissionedAt ?? initial.commissionedAt,
      });
    } else {
      const num = String(equipment.length + 1).padStart(4, "0");
      onSubmit({
        id: `eq-new-${Date.now().toString(36)}`,
        code: `EQ-${num}`,
        ...form,
        location: zone?.name ?? "",
        commissionedAt: form.commissionedAt ?? new Date().toISOString().slice(0, 10),
        lastInspectionAt: null,
        nextInspectionAt: null,
        imageColor: "brand",
      });
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-sm text-(--chip-error-text)">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Общие сведения</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <Input
            label="Наименование"
            required
            placeholder="Rapiscan 620XR"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Тип оборудования"
              required
              placeholder="Рентгенотелевизионная установка"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
            <Dropdown
              label="Статус"
              options={statusOptions}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v as EquipmentStatus }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Производитель"
              placeholder="Rapiscan"
              value={form.manufacturer}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
            />
            <Input
              label="Модель"
              placeholder="620XR"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Серийный номер"
              value={form.serialNumber}
              onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
            <Input
              label="Инвентарный номер"
              value={form.inventoryNumber}
              onChange={(e) => setForm((f) => ({ ...f, inventoryNumber: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Расположение</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Dropdown
              label="Аэропорт"
              required
              placeholder="Выберите"
              options={airportOptions}
              value={form.airportId}
              onChange={(v) => setForm((f) => ({ ...f, airportId: v, terminalId: "", zoneId: "" }))}
            />
            <Dropdown
              label="Терминал"
              required
              placeholder="Выберите"
              disabled={!form.airportId}
              options={terminalOptions}
              value={form.terminalId}
              onChange={(v) => setForm((f) => ({ ...f, terminalId: v, zoneId: "" }))}
            />
            <Dropdown
              label="Зона"
              required
              placeholder="Выберите"
              disabled={!form.terminalId}
              options={zoneOptions}
              value={form.zoneId}
              onChange={(v) => setForm((f) => ({ ...f, zoneId: v }))}
            />
          </div>
          <DatePicker
            label="Дата ввода в эксплуатацию"
            value={form.commissionedAt}
            onChange={(v) => setForm((f) => ({ ...f, commissionedAt: v }))}
            className="max-w-[240px]"
          />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button hierarchy="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button hierarchy="primary" icon={mode === "edit" ? "check" : "plus"} onClick={handleSubmit}>
          {mode === "edit" ? "Сохранить изменения" : "Добавить оборудование"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { faultPriorityConfig } from "@/config/faultStatus.config";
import type { Fault, FaultPriority } from "@/lib/types";
import { useAsync } from "@/hooks/useAsync";
import { equipmentService, faultsService } from "@/services";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (fault: Fault) => void;
}

const CATEGORIES = ["Электроника", "Механика", "Оптика/Датчики", "Электропитание", "Калибровка", "ПО"];

const emptyForm = {
  equipmentId: "",
  title: "",
  description: "",
  category: CATEGORIES[0],
  priority: "medium" as FaultPriority,
  reportedBy: "",
};

export function AddFaultModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: equipmentPage } = useAsync(
    () => equipmentService.listEquipment({ pageSize: 1000 }),
    []
  );
  const equipment = equipmentPage?.items ?? [];

  function reset() {
    setForm(emptyForm);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!form.equipmentId || !form.title || !form.reportedBy) {
      setError("Заполните обязательные поля: оборудование, неисправность, выявил.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const newFault = await faultsService.createFault({
        equipmentId: form.equipmentId,
        title: form.title,
        description: form.description || form.title,
        category: form.category,
        priority: form.priority,
        stage: "detected",
        dueAt: null,
        reportedBy: form.reportedBy,
        assignee: null,
      });
      onCreated(newFault);
      reset();
      onClose();
    } catch {
      setError("Не удалось зарегистрировать неисправность. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Новая неисправность"
      description="Неисправность будет зарегистрирована со статусом «Обнаружена»"
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={handleClose}>
            Отмена
          </Button>
          <Button hierarchy="primary" size="sm" icon="plus" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Регистрация…" : "Зарегистрировать"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-xs text-(--chip-error-text)">
            {error}
          </p>
        )}

        <Dropdown
          label="Оборудование"
          required
          placeholder="Выберите оборудование"
          value={form.equipmentId}
          onChange={(v) => setForm((f) => ({ ...f, equipmentId: v }))}
          options={equipment.map((eq) => ({ value: eq.id, label: `${eq.name} · ${eq.code}` }))}
        />

        <Input
          label="Неисправность"
          required
          placeholder="Не сканирует багаж"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">Описание</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Подробное описание проблемы"
            className="w-full rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary shadow-xs outline-none transition-colors placeholder:text-text-placeholder hover:border-border-secondary focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Dropdown
            label="Категория"
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Dropdown
            label="Приоритет"
            value={form.priority}
            onChange={(v) => setForm((f) => ({ ...f, priority: v as FaultPriority }))}
            options={Object.entries(faultPriorityConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
          />
        </div>

        <Input
          label="Выявил"
          required
          placeholder="ФИО"
          value={form.reportedBy}
          onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
        />
      </div>
    </Modal>
  );
}

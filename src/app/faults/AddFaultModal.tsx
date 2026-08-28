"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { getFaultPriorityConfig } from "@/config/faultStatus.config";
import type { Fault, FaultPriority } from "@/lib/types";
import { useAsync } from "@/hooks/useAsync";
import { equipmentService, faultsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (fault: Fault) => void;
}

const CATEGORY_KEYS: TranslationKey[] = [
  "faults.category.electronics",
  "faults.category.mechanics",
  "faults.category.optics",
  "faults.category.power",
  "faults.category.calibration",
  "faults.category.software",
];

const emptyForm = {
  equipmentId: "",
  title: "",
  description: "",
  category: "",
  priority: "medium" as FaultPriority,
  reportedBy: "",
};

export function AddFaultModal({ open, onClose, onCreated }: Props) {
  const t = useTranslations();
  const CATEGORIES = CATEGORY_KEYS.map((k) => t(k));
  const [form, setForm] = useState({ ...emptyForm, category: CATEGORIES[0] });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: equipmentPage } = useAsync(
    () => equipmentService.listEquipment({ pageSize: 1000 }),
    []
  );
  const equipment = equipmentPage?.items ?? [];
  const faultPriorityConfig = getFaultPriorityConfig(t);

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
      setError(t("faults.modal.requiredError"));
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
      setError(t("faults.modal.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("faults.modal.title")}
      description={t("faults.modal.description")}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" icon="plus" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("faults.modal.registering") : t("faults.modal.register")}
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
          label={t("faults.modal.equipment")}
          required
          placeholder={t("faults.modal.equipmentPlaceholder")}
          value={form.equipmentId}
          onChange={(v) => setForm((f) => ({ ...f, equipmentId: v }))}
          options={equipment.map((eq) => ({ value: eq.id, label: `${eq.name} · ${eq.code}` }))}
        />

        <Input
          label={t("faults.modal.fault")}
          required
          placeholder={t("faults.modal.faultPlaceholder")}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t("faults.modal.description2")}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("faults.modal.descriptionPlaceholder")}
            className="w-full rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary shadow-xs outline-none transition-colors placeholder:text-text-placeholder hover:border-border-secondary focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Dropdown
            label={t("faults.modal.category")}
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Dropdown
            label={t("faults.modal.priority")}
            value={form.priority}
            onChange={(v) => setForm((f) => ({ ...f, priority: v as FaultPriority }))}
            options={Object.entries(faultPriorityConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
          />
        </div>

        <Input
          label={t("faults.modal.reportedBy")}
          required
          placeholder={t("faults.modal.reportedByPlaceholder")}
          value={form.reportedBy}
          onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
        />
      </div>
    </Modal>
  );
}

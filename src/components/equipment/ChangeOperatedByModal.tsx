"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { equipmentService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { Equipment } from "@/lib/types";

interface Props {
  equipment: Equipment;
  onClose: () => void;
  onSaved: () => void;
}

/** Logged "Change Operated By" action — writes an EquipmentChangeLog row on the backend. */
export function ChangeOperatedByModal({ equipment, onClose, onSaved }: Props) {
  const t = useTranslations();
  const { equipmentOperators } = useEquipmentLookups();

  const [operatedById, setOperatedById] = useState(String(equipment.operatedBy.id));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const operatorOptions = equipmentOperators.map((op) => ({ value: String(op.id), label: op.name }));

  async function handleSubmit() {
    if (!operatedById) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await equipmentService.changeEquipmentOperatedBy(equipment.id, { operatedById: Number(operatedById) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : t("settingsCrud.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("equipment.detail.changeOperatedByTitle")}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
            {t("common.save")}
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
          label={t("equipment.form.operatedBy")}
          required
          options={operatorOptions}
          value={operatedById}
          onChange={setOperatedById}
        />
      </div>
    </Modal>
  );
}

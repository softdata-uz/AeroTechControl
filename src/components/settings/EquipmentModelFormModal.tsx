"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { EquipmentType, EquipmentModel } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  types: EquipmentType[];
  initial?: EquipmentModel | null;
  create: (input: { equipmentTypeId: number; name: string }) => Promise<unknown>;
  update: (id: number, input: { equipmentTypeId: number; name: string }) => Promise<unknown>;
}

/** Create/edit modal for Equipment Model — name plus the parent Equipment Type. Mounted only while open. */
export function EquipmentModelFormModal({ onClose, onSaved, types, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [equipmentTypeId, setEquipmentTypeId] = useState(initial ? String(initial.equipmentTypeId) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !equipmentTypeId) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = { equipmentTypeId: Number(equipmentTypeId), name };
      if (initial) {
        await update(initial.id, input);
      } else {
        await create(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setError(t("settingsCrud.duplicateError"));
      } else {
        setError(t("settingsCrud.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("equipment.form.model")}`}
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
          label={t("equipment.form.type")}
          required
          options={types.map((ty) => ({ value: String(ty.id), label: ty.name }))}
          value={equipmentTypeId}
          onChange={setEquipmentTypeId}
        />
        <Input
          label={t("equipment.lookupModal.nameLabel")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </Modal>
  );
}

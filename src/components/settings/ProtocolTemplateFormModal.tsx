"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { EquipmentType, ProtocolTemplate, ProtocolTemplateKind } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  types: EquipmentType[];
  initial?: ProtocolTemplate | null;
  create: (input: { equipmentTypeId: number; name: string; kind: ProtocolTemplateKind }) => Promise<unknown>;
  update: (
    id: number,
    input: { equipmentTypeId: number; name: string; kind: ProtocolTemplateKind }
  ) => Promise<unknown>;
}

/**
 * Create/edit modal for a Protocol Template binding — Equipment Type, a
 * display name, and which of the two FIXED shapes (chart / table) applies.
 * The shape's actual rows/fields are hardcoded on the backend to match the
 * two real paper forms — not editable here.
 */
export function ProtocolTemplateFormModal({ onClose, onSaved, types, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [equipmentTypeId, setEquipmentTypeId] = useState(initial ? String(initial.equipmentTypeId) : "");
  const [kind, setKind] = useState<ProtocolTemplateKind>(initial?.kind ?? "chart");
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
      const input = { equipmentTypeId: Number(equipmentTypeId), name: name.trim(), kind };
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("settingsCrud.protocolTemplateLabel")}`}
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
          label={t("settingsCrud.protocolTemplateName")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Dropdown
          label={t("settingsCrud.protocolKind")}
          required
          options={[
            { value: "chart", label: t("settingsCrud.protocolKindChart") },
            { value: "table", label: t("settingsCrud.protocolKindTable") },
          ]}
          value={kind}
          onChange={(v) => setKind(v as ProtocolTemplateKind)}
        />
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  entityLabel: string;
  /** Present when editing an existing row; absent when creating. */
  initial?: { id: number; name: string } | null;
  create: (input: { name: string }) => Promise<unknown>;
  update: (id: number, input: { name: string }) => Promise<unknown>;
}

/**
 * Single-field create/edit modal for the plain name lookups managed from
 * Settings (Equipment Type, Manufacturer Company, Manufacturer Country,
 * Equipment Operator). Equipment Model needs an extra Type picker, so it
 * uses its own EquipmentModelFormModal instead of this one.
 *
 * Mounted only while open (see call sites), keyed by the record being
 * edited — so its state always starts fresh without needing a
 * reset-on-prop-change effect.
 */
export function LookupFormModal({ onClose, onSaved, entityLabel, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError(t("equipment.lookupModal.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        await update(initial.id, { name });
      } else {
        await create({ name });
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${entityLabel}`}
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

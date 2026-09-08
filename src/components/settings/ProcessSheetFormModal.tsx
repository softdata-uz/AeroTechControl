"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { ProcessSheet, Regulation } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  regulations: Regulation[];
  initial?: ProcessSheet | null;
  create: (input: { regulationId: number; name: string }) => Promise<unknown>;
  update: (id: number, input: { regulationId: number; name: string }) => Promise<unknown>;
}

/** Create/edit modal for Technological Process Sheet — name plus the parent Regulation. Mounted only while open. */
export function ProcessSheetFormModal({ onClose, onSaved, regulations, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [regulationId, setRegulationId] = useState(initial ? String(initial.regulationId) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !regulationId) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = { regulationId: Number(regulationId), name };
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("settingsCrud.processSheetLabel")}`}
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
          label={t("settingsCrud.processSheetRegulationLabel")}
          required
          options={regulations.map((r) => ({ value: String(r.id), label: r.name }))}
          value={regulationId}
          onChange={setRegulationId}
        />
        <Input
          label={t("settingsCrud.processSheetName")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </Modal>
  );
}

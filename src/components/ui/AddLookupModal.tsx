"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";

interface NameForm {
  name: string;
}

const emptyForm: NameForm = { name: "" };

interface Props<T> {
  open: boolean;
  onClose: () => void;
  onCreated: (record: T) => void;
  /** Localized display name of the entity being created, e.g. "Manufacturer Company" — used to build the title. */
  entityLabel: string;
  create: (form: NameForm) => Promise<T>;
}

/**
 * Generic "Add new <lookup>" modal shared by every reference table
 * (Equipment Type/Model, Manufacturer Company/Country, Equipment
 * Operator) — one implementation instead of five near-identical ones.
 * Reused by SelectWithAddNew as its default create flow.
 */
export function AddLookupModal<T>({ open, onClose, onCreated, entityLabel, create }: Props<T>) {
  const t = useTranslations();
  const [form, setForm] = useState<NameForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm(emptyForm);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("equipment.lookupModal.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await create(form);
      onCreated(created);
      reset();
      onClose();
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        setError(t("equipment.lookupModal.duplicateError"));
      } else {
        setError(t("equipment.lookupModal.submitError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`${t("equipment.lookupModal.newPrefix")} ${entityLabel}`}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" icon="plus" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("equipment.lookupModal.creating") : t("equipment.lookupModal.create")}
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
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
        />
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { UZBEKISTAN_REGIONS, type UzbekistanRegion } from "@/config/regions.config";
import type { Airport } from "@/lib/types";
import type { AirportInput } from "@/services/airports.service";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  initial?: Airport | null;
  create: (input: AirportInput) => Promise<unknown>;
  update: (id: number, input: Partial<AirportInput>) => Promise<unknown>;
}

/** Mounted only while open — see call site. */
export function AirportFormModal({ onClose, onSaved, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [region, setRegion] = useState<UzbekistanRegion | "">(initial?.region ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !code.trim() || !region) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = { name, code, region };
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("equipment.form.airport")}`}
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
        <Input
          label={t("settingsCrud.codeFieldLabel")}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Dropdown
          label={t("settingsCrud.regionFieldLabel")}
          required
          value={region}
          onChange={(value) => setRegion(value as UzbekistanRegion)}
          options={UZBEKISTAN_REGIONS}
        />
      </div>
    </Modal>
  );
}

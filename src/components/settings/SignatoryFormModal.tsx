"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { Airport, Signatory, SignatoryType } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  airports: Airport[];
  initial?: Signatory | null;
  create: (input: { airportId: number; fullName: string; type: SignatoryType }) => Promise<unknown>;
  update: (
    id: number,
    input: { airportId?: number; fullName?: string; type?: SignatoryType }
  ) => Promise<unknown>;
}

export function SignatoryFormModal({ onClose, onSaved, airports, initial, create, update }: Props) {
  const t = useTranslations();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [airportId, setAirportId] = useState(initial ? String(initial.airportId) : "");
  const [type, setType] = useState<SignatoryType>(initial?.type ?? "operator");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim() || !airportId) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = { airportId: Number(airportId), fullName: fullName.trim(), type };
      if (initial) {
        await update(initial.id, input);
      } else {
        await create(input);
      }
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("settingsCrud.signatoryLabel")}`}
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
          label={t("settingsCrud.signatoryFullName")}
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Dropdown
          label={t("settingsCrud.signatoryAirport")}
          required
          options={airports.map((a) => ({ value: String(a.id), label: a.name }))}
          value={airportId}
          onChange={setAirportId}
        />
        <Dropdown
          label={t("settingsCrud.signatoryType")}
          required
          options={[
            { value: "operator", label: t("settingsCrud.signatoryTypeOperator") },
            { value: "company_representative", label: t("settingsCrud.signatoryTypeCompanyRep") },
          ]}
          value={type}
          onChange={(v) => setType(v as SignatoryType)}
        />
      </div>
    </Modal>
  );
}

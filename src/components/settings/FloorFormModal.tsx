"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ImageUploadField, type ImageUploadValue } from "@/components/equipment/ImageUploadField";
import { ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { Terminal, Floor } from "@/lib/types";
import type { FloorInput } from "@/services/airports.service";

const MAP_ACCEPTED_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAP_MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  onClose: () => void;
  onSaved: () => void;
  terminals: Terminal[];
  initial?: Floor | null;
  create: (input: FloorInput) => Promise<unknown>;
  update: (id: number, input: Partial<FloorInput>) => Promise<unknown>;
}

/** Mounted only while open — see call site. */
export function FloorFormModal({ onClose, onSaved, terminals, initial, create, update }: Props) {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name ?? "");
  const [terminalId, setTerminalId] = useState(initial ? String(initial.terminalId) : "");
  const [mapImage, setMapImage] = useState<ImageUploadValue>({
    existingUrl: initial?.mapImageUrl ?? null,
    file: null,
    removed: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !terminalId) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        terminalId: Number(terminalId),
        name,
        mapImage: mapImage.file ?? undefined,
      };
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
      title={`${t(initial ? "settingsCrud.editPrefix" : "equipment.lookupModal.newPrefix")} ${t("equipment.form.floor")}`}
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
          label={t("equipment.form.terminal")}
          required
          options={terminals.map((term) => ({ value: String(term.id), label: term.name }))}
          value={terminalId}
          onChange={setTerminalId}
        />
        <Input
          label={t("equipment.lookupModal.nameLabel")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ImageUploadField
          label={t("location.mapImageLabel")}
          value={mapImage}
          onChange={setMapImage}
          disabled={submitting}
          acceptedTypes={MAP_ACCEPTED_TYPES}
          maxBytes={MAP_MAX_BYTES}
        />
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import type { EquipmentDocument } from "@/lib/types";
import { useAsync } from "@/hooks/useAsync";
import { documentsService, equipmentService } from "@/services";
import type { IconName } from "@/components/icons";
import { useTranslations } from "@/lib/locale-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (doc: EquipmentDocument) => void;
  typeMeta: Record<EquipmentDocument["type"], { label: string; icon: IconName }>;
}

const emptyForm = {
  title: "",
  type: "certificate" as EquipmentDocument["type"],
  equipmentId: "",
  author: "",
  version: "1.0",
};

export function UploadDocumentModal({ open, onClose, onCreated, typeMeta }: Props) {
  const t = useTranslations();
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: equipmentPage } = useAsync(
    () => equipmentService.listEquipment({ pageSize: 1000 }),
    []
  );
  const equipment = equipmentPage?.items ?? [];

  function reset() {
    setForm(emptyForm);
    setFile(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!form.title || !form.author || !file) {
      setError(t("documents.modal.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const doc = await documentsService.createDocument({
        equipmentId: form.equipmentId ? Number(form.equipmentId) : null,
        title: form.title,
        type: form.type,
        status: "active",
        author: form.author,
        version: form.version || "1.0",
        file,
      });
      onCreated(doc);
      reset();
      onClose();
    } catch {
      setError(t("documents.modal.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("documents.modal.title")}
      description={t("documents.modal.description")}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" icon="upload" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("documents.modal.uploading") : t("documents.modal.uploadAction")}
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
          label={t("documents.modal.documentTitle")}
          required
          placeholder={t("documents.modal.titlePlaceholder")}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Dropdown
            label={t("documents.modal.type")}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v as EquipmentDocument["type"] }))}
            options={Object.entries(typeMeta).map(([key, m]) => ({ value: key, label: m.label, icon: m.icon }))}
          />
          <Input
            label={t("documents.modal.version")}
            value={form.version}
            onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
          />
        </div>

        <Dropdown
          label={t("documents.modal.equipment")}
          placeholder={t("documents.modal.equipmentPlaceholder")}
          value={form.equipmentId}
          onChange={(v) => setForm((f) => ({ ...f, equipmentId: v }))}
          options={equipment.map((eq) => ({ value: String(eq.id), label: `${eq.name} · ${eq.code}` }))}
        />

        <Input
          label={t("documents.modal.author")}
          required
          placeholder={t("documents.modal.authorPlaceholder")}
          value={form.author}
          onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            {t("documents.modal.file")}
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary file:mr-3 file:rounded file:border-0 file:bg-bg-tertiary file:px-2 file:py-1 file:text-xs file:text-text-secondary"
          />
        </div>
      </div>
    </Modal>
  );
}

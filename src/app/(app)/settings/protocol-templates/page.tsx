"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrudListPanel } from "@/components/settings/CrudListPanel";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { ProtocolTemplateFormModal } from "@/components/settings/ProtocolTemplateFormModal";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { equipmentService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { ProtocolTemplate } from "@/lib/types";

export default function SettingsProtocolTemplatesPage() {
  const t = useTranslations();
  const { types, protocolTemplates, loading, refetch } = useEquipmentLookups();

  const [form, setForm] = useState<{ initial: ProtocolTemplate | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleteTarget == null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await equipmentService.deleteProtocolTemplate(deleteTarget);
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      setDeleteError(
        err instanceof ApiException && err.status === 409
          ? t("settingsCrud.conflictError")
          : t("settingsCrud.genericError")
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("settingsCrud.protocolTemplatesPageTitle")}
        context={t("settingsCrud.protocolTemplatesPageContext")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5">
        <CrudListPanel
          title={t("settingsCrud.protocolTemplateLabel")}
          loading={loading}
          addLabel={t("settingsCrud.protocolTemplateLabel")}
          items={protocolTemplates.map((p) => ({
            id: p.id,
            primary: p.name,
            secondary: `${types.find((ty) => ty.id === p.equipmentTypeId)?.name ?? "—"} · ${t(p.kind === "chart" ? "settingsCrud.protocolKindChart" : "settingsCrud.protocolKindTable")}`,
          }))}
          onAdd={() => setForm({ initial: null })}
          onEdit={(id) => {
            const row = protocolTemplates.find((p) => p.id === id);
            if (row) setForm({ initial: row });
          }}
          onDelete={(id) => setDeleteTarget(Number(id))}
        />
      </div>

      {form && (
        <ProtocolTemplateFormModal
          key={form.initial?.id ?? "new"}
          onClose={() => setForm(null)}
          onSaved={refetch}
          types={types}
          initial={form.initial}
          create={equipmentService.createProtocolTemplate}
          update={equipmentService.updateProtocolTemplate}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={t("settingsCrud.deleteConfirmTitle")}
        message={deleteError ?? t("settingsCrud.deleteConfirmMessage")}
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}

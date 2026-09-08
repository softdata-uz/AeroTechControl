"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrudListPanel } from "@/components/settings/CrudListPanel";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { RegulationFormModal } from "@/components/settings/RegulationFormModal";
import { ProcessSheetFormModal } from "@/components/settings/ProcessSheetFormModal";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { equipmentService, processSheetsApi, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { ProcessSheet, Regulation } from "@/lib/types";

type Kind = "regulation" | "processSheet";

export default function SettingsRegulationsPage() {
  const t = useTranslations();
  const { types, regulations, loading: lookupsLoading, refetch: refetchLookups } = useEquipmentLookups();

  const [processSheets, setProcessSheets] = useState<ProcessSheet[]>([]);
  const [processSheetsLoading, setProcessSheetsLoading] = useState(true);

  const loadProcessSheets = useCallback(() => {
    return processSheetsApi.list().then(setProcessSheets);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadProcessSheets().finally(() => {
      if (!cancelled) setProcessSheetsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadProcessSheets]);

  const [regulationForm, setRegulationForm] = useState<{ initial: Regulation | null } | null>(null);
  const [processSheetForm, setProcessSheetForm] = useState<{ initial: ProcessSheet | null } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ kind: Kind; id: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === "regulation") {
        await equipmentService.deleteRegulation(deleteTarget.id);
        await refetchLookups();
      } else {
        await processSheetsApi.remove(deleteTarget.id);
        await loadProcessSheets();
      }
      setDeleteTarget(null);
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

  async function handleProcessSheetSaved() {
    await loadProcessSheets();
    await refetchLookups();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("settingsCrud.regulationsPageTitle")}
        context={t("settingsCrud.regulationsPageContext")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5 md:grid-cols-2">
        <CrudListPanel
          title={t("settingsCrud.regulationLabel")}
          loading={lookupsLoading}
          addLabel={t("settingsCrud.regulationLabel")}
          items={regulations.map((r) => ({
            id: r.id,
            primary: r.name,
            secondary: types.find((ty) => ty.id === r.equipmentTypeId)?.name,
          }))}
          onAdd={() => setRegulationForm({ initial: null })}
          onEdit={(id) => {
            const row = regulations.find((r) => r.id === id);
            if (row) setRegulationForm({ initial: row });
          }}
          onDelete={(id) => setDeleteTarget({ kind: "regulation", id: Number(id) })}
        />

        <CrudListPanel
          title={t("settingsCrud.processSheetLabel")}
          loading={processSheetsLoading}
          addLabel={t("settingsCrud.processSheetLabel")}
          items={processSheets.map((p) => ({
            id: p.id,
            primary: p.name,
            secondary: regulations.find((r) => r.id === p.regulationId)?.name,
          }))}
          onAdd={() => setProcessSheetForm({ initial: null })}
          onEdit={(id) => {
            const row = processSheets.find((p) => p.id === id);
            if (row) setProcessSheetForm({ initial: row });
          }}
          onDelete={(id) => setDeleteTarget({ kind: "processSheet", id: Number(id) })}
        />
      </div>

      {regulationForm && (
        <RegulationFormModal
          key={`regulation-${regulationForm.initial?.id ?? "new"}`}
          onClose={() => setRegulationForm(null)}
          onSaved={refetchLookups}
          types={types}
          initial={regulationForm.initial}
          create={equipmentService.createRegulation}
          update={equipmentService.updateRegulation}
        />
      )}

      {processSheetForm && (
        <ProcessSheetFormModal
          key={`processSheet-${processSheetForm.initial?.id ?? "new"}`}
          onClose={() => setProcessSheetForm(null)}
          onSaved={handleProcessSheetSaved}
          regulations={regulations}
          initial={processSheetForm.initial}
          create={processSheetsApi.create}
          update={processSheetsApi.update}
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

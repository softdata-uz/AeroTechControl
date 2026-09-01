"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrudListPanel } from "@/components/settings/CrudListPanel";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { LookupFormModal } from "@/components/settings/LookupFormModal";
import { EquipmentModelFormModal } from "@/components/settings/EquipmentModelFormModal";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { equipmentService, equipmentOperatorsApi, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { EquipmentType, EquipmentOperator, EquipmentModel } from "@/lib/types";

type LookupKind = "type" | "operator";

export default function SettingsEquipmentPage() {
  const t = useTranslations();
  const { types, models, equipmentOperators, loading, refetch } = useEquipmentLookups();

  const [lookupForm, setLookupForm] = useState<{
    kind: LookupKind;
    initial: { id: number; name: string } | null;
  } | null>(null);
  const [modelFormOpen, setModelFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<EquipmentModel | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ kind: LookupKind | "model"; id: number } | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function typeName(id: number) {
    return types.find((ty) => ty.id === id)?.name ?? "—";
  }

  const lookupServiceFor = (kind: LookupKind) => {
    if (kind === "type") {
      return {
        create: equipmentService.createEquipmentType,
        update: equipmentService.updateEquipmentType,
        remove: equipmentService.deleteEquipmentType,
      };
    }
    return equipmentOperatorsApi;
  };

  const entityLabelFor = (kind: LookupKind) => {
    if (kind === "type") return t("equipment.form.type");
    return t("equipment.form.operatedBy");
  };

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === "model") {
        await equipmentService.deleteEquipmentModel(deleteTarget.id);
      } else {
        await lookupServiceFor(deleteTarget.kind).remove(deleteTarget.id);
      }
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

  function lookupPanel(kind: LookupKind, title: string, items: (EquipmentType | EquipmentOperator)[]) {
    return (
      <CrudListPanel
        title={title}
        loading={loading}
        addLabel={entityLabelFor(kind)}
        items={items.map((row) => ({ id: row.id, primary: row.name }))}
        onAdd={() => setLookupForm({ kind, initial: null })}
        onEdit={(id) => {
          const row = items.find((r) => r.id === id);
          if (row) setLookupForm({ kind, initial: { id: row.id, name: row.name } });
        }}
        onDelete={(id) => setDeleteTarget({ kind, id: Number(id) })}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("settingsCrud.equipmentPageTitle")}
        context={t("settingsCrud.equipmentPageContext")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5 md:grid-cols-2 xl:grid-cols-3">
        {lookupPanel("type", t("settings.equipmentTypes"), types)}

        <CrudListPanel
          title={t("settingsCrud.equipmentModels")}
          loading={loading}
          addLabel={t("equipment.form.model")}
          items={models.map((m) => ({ id: m.id, primary: m.name, secondary: typeName(m.equipmentTypeId) }))}
          onAdd={() => {
            setEditingModel(null);
            setModelFormOpen(true);
          }}
          onEdit={(id) => {
            const model = models.find((m) => m.id === id);
            if (model) {
              setEditingModel(model);
              setModelFormOpen(true);
            }
          }}
          onDelete={(id) => setDeleteTarget({ kind: "model", id: Number(id) })}
        />

        {lookupPanel("operator", t("settingsCrud.equipmentOperators"), equipmentOperators)}
      </div>

      {lookupForm && (
        <LookupFormModal
          key={`${lookupForm.kind}-${lookupForm.initial?.id ?? "new"}`}
          onClose={() => setLookupForm(null)}
          onSaved={refetch}
          entityLabel={entityLabelFor(lookupForm.kind)}
          initial={lookupForm.initial}
          create={lookupServiceFor(lookupForm.kind).create}
          update={lookupServiceFor(lookupForm.kind).update}
        />
      )}

      {modelFormOpen && (
        <EquipmentModelFormModal
          key={editingModel?.id ?? "new"}
          onClose={() => setModelFormOpen(false)}
          onSaved={refetch}
          types={types}
          initial={editingModel}
          create={equipmentService.createEquipmentModel}
          update={equipmentService.updateEquipmentModel}
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

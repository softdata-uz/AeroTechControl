"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrudListPanel } from "@/components/settings/CrudListPanel";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { LookupFormModal } from "@/components/settings/LookupFormModal";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import { manufacturerCompaniesApi, manufacturerCountriesApi, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { ManufacturerCompany, ManufacturerCountry } from "@/lib/types";

type LookupKind = "manufacturerCompany" | "manufacturerCountry";

export default function SettingsManufacturersPage() {
  const t = useTranslations();
  const { manufacturerCompanies, manufacturerCountries, loading, refetch } = useEquipmentLookups();

  const [lookupForm, setLookupForm] = useState<{
    kind: LookupKind;
    initial: { id: number; name: string } | null;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ kind: LookupKind; id: number } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lookupServiceFor = (kind: LookupKind) =>
    kind === "manufacturerCompany" ? manufacturerCompaniesApi : manufacturerCountriesApi;

  const entityLabelFor = (kind: LookupKind) =>
    kind === "manufacturerCompany"
      ? t("equipment.form.manufacturerCompany")
      : t("equipment.form.manufacturerCountry");

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await lookupServiceFor(deleteTarget.kind).remove(deleteTarget.id);
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

  function lookupPanel(kind: LookupKind, title: string, items: (ManufacturerCompany | ManufacturerCountry)[]) {
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
        title={t("settingsCrud.manufacturersPageTitle")}
        context={t("settingsCrud.manufacturersPageContext")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5 md:grid-cols-2">
        {lookupPanel("manufacturerCompany", t("settingsCrud.manufacturerCompanies"), manufacturerCompanies)}
        {lookupPanel("manufacturerCountry", t("settingsCrud.manufacturerCountries"), manufacturerCountries)}
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

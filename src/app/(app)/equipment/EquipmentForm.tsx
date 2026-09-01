"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dropdown } from "@/components/ui/Dropdown";
import { SelectWithAddNew } from "@/components/ui/SelectWithAddNew";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ImageUploadField, type ImageUploadValue } from "@/components/equipment/ImageUploadField";
import { useLocations } from "@/hooks/useLocations";
import { useEquipmentLookups } from "@/hooks/useEquipmentLookups";
import {
  equipmentService,
  manufacturerCompaniesApi,
  manufacturerCountriesApi,
  equipmentOperatorsApi,
  airportsService,
} from "@/services";
import type { EquipmentInput } from "@/services/equipment.service";
import { ApiException } from "@/services";
import type { Equipment, EquipmentStatus } from "@/lib/types";
import { useTranslations } from "@/lib/locale-context";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";

export interface EquipmentFormValues extends EquipmentInput {
  image?: File | null;
}

interface Props {
  mode: "add" | "edit";
  initial?: Equipment;
  onSubmit: (values: EquipmentFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

/**
 * 15+ fields across 4 sections — per pickFormLayout() (src/lib/form-layout.ts)
 * that's a dedicated-page form, not a Modal/Drawer. Rendered by
 * /equipment/new and /equipment/[id]/edit; no Modal/Drawer chrome here.
 */
export const EQUIPMENT_FORM_FIELD_COUNT = 20;

interface FormState {
  name: string;
  equipmentTypeId: string;
  equipmentModelId: string;
  manufacturerCompanyId: string;
  manufacturerCountryId: string;
  serialNumber: string;
  inventoryNumber: string;
  airportId: string;
  terminalId: string;
  zoneId: string;
  operatedById: string;
  status: EquipmentStatus;
  manufactureYear: string;
  purchaseYear: string;
  commissioningYear: string;
  serviceLifeExpiryYear: string;
  notes: string;
}

function formFromEquipment(eq: Equipment): FormState {
  return {
    name: eq.name,
    equipmentTypeId: String(eq.equipmentType.id),
    equipmentModelId: String(eq.equipmentModel.id),
    manufacturerCompanyId: String(eq.manufacturerCompany.id),
    manufacturerCountryId: String(eq.manufacturerCountry.id),
    serialNumber: eq.serialNumber ?? "",
    inventoryNumber: eq.inventoryNumber ?? "",
    airportId: String(eq.airport.id),
    terminalId: eq.terminal ? String(eq.terminal.id) : "",
    zoneId: eq.zone ? String(eq.zone.id) : "",
    operatedById: String(eq.operatedBy.id),
    status: eq.status,
    manufactureYear: String(eq.manufactureYear),
    purchaseYear: eq.purchaseYear != null ? String(eq.purchaseYear) : "",
    commissioningYear: eq.commissioningYear != null ? String(eq.commissioningYear) : "",
    serviceLifeExpiryYear: eq.serviceLifeExpiryYear != null ? String(eq.serviceLifeExpiryYear) : "",
    notes: eq.notes ?? "",
  };
}

const emptyForm: FormState = {
  name: "",
  equipmentTypeId: "",
  equipmentModelId: "",
  manufacturerCompanyId: "",
  manufacturerCountryId: "",
  serialNumber: "",
  inventoryNumber: "",
  airportId: "",
  terminalId: "",
  zoneId: "",
  operatedById: "",
  status: "operational",
  manufactureYear: "",
  purchaseYear: "",
  commissioningYear: "",
  serviceLifeExpiryYear: "",
  notes: "",
};

export function EquipmentForm({ mode, initial, onSubmit, onCancel, submitting = false }: Props) {
  const t = useTranslations();
  const { airports, terminalsByAirport, zonesByTerminal, addTerminal, addZone } = useLocations();
  const {
    types,
    modelsByType,
    manufacturerCompanies,
    manufacturerCountries,
    equipmentOperators,
    addType,
    addModel,
    addManufacturerCompany,
    addManufacturerCountry,
    addEquipmentOperator,
  } = useEquipmentLookups();
  const [form, setForm] = useState<FormState>(() => (initial ? formFromEquipment(initial) : emptyForm));
  const [image, setImage] = useState<ImageUploadValue>({
    existingUrl: initial?.imageUrl ?? null,
    file: null,
    removed: false,
  });
  const [error, setError] = useState<string | null>(null);

  const airportOptions = airports.map((a) => ({ value: String(a.id), label: a.city }));
  const terminalOptions = form.airportId
    ? terminalsByAirport(Number(form.airportId)).map((term) => ({
        value: String(term.id),
        label: term.name,
      }))
    : [];
  const zoneOptions = form.terminalId
    ? zonesByTerminal(Number(form.terminalId)).map((z) => ({ value: String(z.id), label: z.name }))
    : [];

  const typeOptions = types.map((ty) => ({ value: String(ty.id), label: ty.name }));
  const modelOptions = form.equipmentTypeId
    ? modelsByType(Number(form.equipmentTypeId)).map((m) => ({ value: String(m.id), label: m.name }))
    : [];
  const manufacturerCompanyOptions = manufacturerCompanies.map((mc) => ({
    value: String(mc.id),
    label: mc.name,
  }));
  const manufacturerCountryOptions = manufacturerCountries.map((mc) => ({
    value: String(mc.id),
    label: mc.name,
  }));
  const operatorOptions = equipmentOperators.map((op) => ({ value: String(op.id), label: op.name }));

  const statusConfig = getEquipmentStatusConfig(t);
  const statusOptions = Object.entries(statusConfig).map(([key, cfg]) => ({
    value: key,
    label: cfg.label,
  }));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (
      !form.name ||
      !form.equipmentTypeId ||
      !form.equipmentModelId ||
      !form.manufacturerCompanyId ||
      !form.manufacturerCountryId ||
      !form.airportId ||
      !form.operatedById ||
      !form.serialNumber ||
      !form.status ||
      !form.manufactureYear
    ) {
      setError(t("equipment.form.requiredError"));
      return;
    }
    setError(null);
    try {
      await onSubmit({
        name: form.name,
        equipmentTypeId: Number(form.equipmentTypeId),
        equipmentModelId: Number(form.equipmentModelId),
        manufacturerCompanyId: Number(form.manufacturerCompanyId),
        manufacturerCountryId: Number(form.manufacturerCountryId),
        serialNumber: form.serialNumber,
        inventoryNumber: form.inventoryNumber || undefined,
        airportId: Number(form.airportId),
        terminalId: form.terminalId ? Number(form.terminalId) : undefined,
        zoneId: form.zoneId ? Number(form.zoneId) : undefined,
        operatedById: Number(form.operatedById),
        status: form.status,
        manufactureYear: Number(form.manufactureYear),
        purchaseYear: form.purchaseYear ? Number(form.purchaseYear) : undefined,
        commissioningYear: form.commissioningYear ? Number(form.commissioningYear) : undefined,
        serviceLifeExpiryYear: form.serviceLifeExpiryYear ? Number(form.serviceLifeExpiryYear) : undefined,
        notes: form.notes || undefined,
        image: image.file ?? (image.removed ? null : undefined),
      });
    } catch (err) {
      setError(
        err instanceof ApiException && err.status === 409
          ? t("equipment.form.serialNumberDuplicateError")
          : t("equipment.form.submitError")
      );
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-sm text-(--chip-error-text)">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("equipment.form.generalInfo")}</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
            <ImageUploadField label={t("equipment.form.image")} value={image} onChange={setImage} disabled={submitting} />
            <div className="space-y-4">
              <Input
                label={t("equipment.form.name")}
                required
                placeholder={t("equipment.form.namePlaceholder")}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectWithAddNew
                  label={t("equipment.form.type")}
                  entityLabel={t("equipment.form.type")}
                  required
                  options={typeOptions}
                  value={form.equipmentTypeId}
                  onChange={(v) => setForm((f) => ({ ...f, equipmentTypeId: v, equipmentModelId: "" }))}
                  create={(nameForm) => equipmentService.createEquipmentType(nameForm)}
                  toOption={(created) => ({ value: String(created.id), label: created.name })}
                  onCreated={(created) => addType(created)}
                />
                <SelectWithAddNew
                  label={t("equipment.form.model")}
                  entityLabel={t("equipment.form.model")}
                  required
                  disabled={!form.equipmentTypeId}
                  options={modelOptions}
                  value={form.equipmentModelId}
                  onChange={(v) => update("equipmentModelId", v)}
                  create={(nameForm) =>
                    equipmentService.createEquipmentModel({
                      equipmentTypeId: Number(form.equipmentTypeId),
                      ...nameForm,
                    })
                  }
                  toOption={(created) => ({ value: String(created.id), label: created.name })}
                  onCreated={(created) => addModel(created)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectWithAddNew
              label={t("equipment.form.manufacturerCompany")}
              entityLabel={t("equipment.form.manufacturerCompany")}
              required
              options={manufacturerCompanyOptions}
              value={form.manufacturerCompanyId}
              onChange={(v) => update("manufacturerCompanyId", v)}
              create={(nameForm) => manufacturerCompaniesApi.create(nameForm)}
              toOption={(created) => ({ value: String(created.id), label: created.name })}
              onCreated={(created) => addManufacturerCompany(created)}
            />
            <SelectWithAddNew
              label={t("equipment.form.manufacturerCountry")}
              entityLabel={t("equipment.form.manufacturerCountry")}
              required
              options={manufacturerCountryOptions}
              value={form.manufacturerCountryId}
              onChange={(v) => update("manufacturerCountryId", v)}
              create={(nameForm) => manufacturerCountriesApi.create(nameForm)}
              toOption={(created) => ({ value: String(created.id), label: created.name })}
              onCreated={(created) => addManufacturerCountry(created)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("equipment.form.serialNumber")}
              required
              value={form.serialNumber}
              onChange={(e) => update("serialNumber", e.target.value)}
            />
            <Input
              label={t("equipment.form.inventoryNumber")}
              value={form.inventoryNumber}
              onChange={(e) => update("inventoryNumber", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("equipment.form.location")}</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Dropdown
              label={t("equipment.form.airport")}
              required
              options={airportOptions}
              value={form.airportId}
              onChange={(v) => setForm((f) => ({ ...f, airportId: v, terminalId: "", zoneId: "" }))}
            />
            <SelectWithAddNew
              label={t("equipment.form.terminal")}
              entityLabel={t("equipment.form.terminal")}
              disabled={!form.airportId}
              options={terminalOptions}
              value={form.terminalId}
              onChange={(v) => setForm((f) => ({ ...f, terminalId: v, zoneId: "" }))}
              create={(nameForm) =>
                airportsService.createTerminal({
                  airportId: Number(form.airportId),
                  ...nameForm,
                })
              }
              toOption={(created) => ({ value: String(created.id), label: created.name })}
              onCreated={(created) => addTerminal(created)}
            />
            <SelectWithAddNew
              label={t("equipment.form.zone")}
              entityLabel={t("equipment.form.zone")}
              disabled={!form.terminalId}
              options={zoneOptions}
              value={form.zoneId}
              onChange={(v) => update("zoneId", v)}
              create={(nameForm) =>
                airportsService.createZone({
                  terminalId: Number(form.terminalId),
                  ...nameForm,
                })
              }
              toOption={(created) => ({ value: String(created.id), label: created.name })}
              onCreated={(created) => addZone(created)}
            />
          </div>
          <SelectWithAddNew
            label={t("equipment.form.operatedBy")}
            entityLabel={t("equipment.form.operatedBy")}
            required
            options={operatorOptions}
            value={form.operatedById}
            onChange={(v) => update("operatedById", v)}
            create={(nameForm) => equipmentOperatorsApi.create(nameForm)}
            toOption={(created) => ({ value: String(created.id), label: created.name })}
            onCreated={(created) => addEquipmentOperator(created)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("equipment.form.lifecycle")}</CardTitle>
        </CardHeader>
        <div className="space-y-4 p-4">
          <Dropdown
            label={t("equipment.form.status")}
            required
            options={statusOptions}
            value={form.status}
            onChange={(v) => update("status", v as EquipmentStatus)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="number"
              label={t("equipment.form.manufactureYear")}
              required
              value={form.manufactureYear}
              onChange={(e) => update("manufactureYear", e.target.value)}
            />
            <Input
              type="number"
              label={t("equipment.form.serviceLifeExpiryYear")}
              value={form.serviceLifeExpiryYear}
              onChange={(e) => update("serviceLifeExpiryYear", e.target.value)}
            />
            <Input
              type="number"
              label={t("equipment.form.purchaseYear")}
              value={form.purchaseYear}
              onChange={(e) => update("purchaseYear", e.target.value)}
            />
            <Input
              type="number"
              label={t("equipment.form.commissioningYear")}
              value={form.commissioningYear}
              onChange={(e) => update("commissioningYear", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("equipment.form.notesSection")}</CardTitle>
        </CardHeader>
        <div className="p-4">
          <Textarea
            label={t("equipment.form.notes")}
            placeholder={t("equipment.form.notesPlaceholder")}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button hierarchy="secondary" onClick={onCancel} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button
          hierarchy="primary"
          icon={mode === "edit" ? "check" : "plus"}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {mode === "edit" ? t("equipment.form.saveChanges") : t("equipment.addEquipment")}
        </Button>
      </div>
    </div>
  );
}

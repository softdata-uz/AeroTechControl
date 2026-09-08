import type {
  Equipment,
  EquipmentChangeLog,
  EquipmentModel,
  EquipmentStatus,
  EquipmentType,
  Regulation,
} from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiPost, apiDelete, apiUpload, apiDownload, type Page } from "./http-client";

export interface EquipmentFilters {
  airportId?: number;
  terminalId?: number;
  floorId?: number;
  zoneId?: number;
  equipmentTypeId?: number;
  equipmentModelId?: number;
  manufacturerCompanyId?: number;
  manufacturerCountryId?: number;
  operatedById?: number;
  status?: EquipmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /equipment
export function listEquipment(filters: EquipmentFilters = {}): Promise<Page<Equipment>> {
  return apiGetPage<Equipment>("/equipment", filters);
}

// GET /equipment/:id
export function getEquipment(id: number): Promise<Equipment> {
  return apiGet<Equipment>(`/equipment/${id}`);
}

// GET /equipment/:id/qr-code
export function getEquipmentQrCode(id: number): Promise<{ qrCodeUrl: string }> {
  return apiGet<{ qrCodeUrl: string }>(`/equipment/${id}/qr-code`);
}

// GET /equipment/:id/change-history
export function listEquipmentChangeHistory(
  id: number,
  filters: { page?: number; pageSize?: number } = {}
): Promise<Page<EquipmentChangeLog>> {
  return apiGetPage<EquipmentChangeLog>(`/equipment/${id}/change-history`, filters);
}

// PATCH /equipment/:id/location
export function changeEquipmentLocation(
  id: number,
  input: { airportId: number; terminalId?: number; floorId?: number; zoneId?: number; location?: string }
): Promise<Equipment> {
  return apiPatch<Equipment>(`/equipment/${id}/location`, input);
}

// PATCH /equipment/:id/operated-by
export function changeEquipmentOperatedBy(id: number, input: { operatedById: number }): Promise<Equipment> {
  return apiPatch<Equipment>(`/equipment/${id}/operated-by`, input);
}

// GET /equipment/export
export function exportEquipment(filters: EquipmentFilters = {}): Promise<void> {
  return apiDownload("/equipment/export", filters, "equipment.xlsx");
}

// PATCH /equipment/:id/status
export function updateEquipmentStatus(id: number, status: EquipmentStatus): Promise<Equipment> {
  return apiPatch<Equipment>(`/equipment/${id}/status`, { status });
}

// PATCH /equipment/:id/position
export function updateEquipmentPosition(
  id: number,
  input: { x: number; y: number; zoneId?: number }
): Promise<Equipment> {
  return apiPatch<Equipment>(`/equipment/${id}/position`, input);
}

// GET /equipment-types
export function listEquipmentTypes(): Promise<EquipmentType[]> {
  return apiGet<EquipmentType[]>("/equipment-types");
}

// POST /equipment-types
export function createEquipmentType(input: { name: string }): Promise<EquipmentType> {
  return apiPost<EquipmentType>("/equipment-types", input);
}

// PATCH /equipment-types/:id
export function updateEquipmentType(id: number, input: { name: string }): Promise<EquipmentType> {
  return apiPatch<EquipmentType>(`/equipment-types/${id}`, input);
}

// DELETE /equipment-types/:id
export function deleteEquipmentType(id: number): Promise<void> {
  return apiDelete<void>(`/equipment-types/${id}`);
}

// GET /equipment-models?equipmentTypeId=
export function listEquipmentModels(equipmentTypeId?: number): Promise<EquipmentModel[]> {
  return apiGet<EquipmentModel[]>("/equipment-models", { equipmentTypeId });
}

// POST /equipment-models
export function createEquipmentModel(input: {
  equipmentTypeId: number;
  name: string;
}): Promise<EquipmentModel> {
  return apiPost<EquipmentModel>("/equipment-models", input);
}

// PATCH /equipment-models/:id
export function updateEquipmentModel(
  id: number,
  input: { equipmentTypeId?: number; name?: string }
): Promise<EquipmentModel> {
  return apiPatch<EquipmentModel>(`/equipment-models/${id}`, input);
}

// DELETE /equipment-models/:id
export function deleteEquipmentModel(id: number): Promise<void> {
  return apiDelete<void>(`/equipment-models/${id}`);
}

// GET /regulations?equipmentTypeId=
export function listRegulations(equipmentTypeId?: number): Promise<Regulation[]> {
  return apiGet<Regulation[]>("/regulations", { equipmentTypeId });
}

// POST /regulations
export function createRegulation(input: {
  equipmentTypeId: number;
  name: string;
}): Promise<Regulation> {
  return apiPost<Regulation>("/regulations", input);
}

// PATCH /regulations/:id
export function updateRegulation(
  id: number,
  input: { equipmentTypeId?: number; name?: string }
): Promise<Regulation> {
  return apiPatch<Regulation>(`/regulations/${id}`, input);
}

// DELETE /regulations/:id
export function deleteRegulation(id: number): Promise<void> {
  return apiDelete<void>(`/regulations/${id}`);
}

export interface EquipmentInput {
  name: string;
  equipmentTypeId: number | "";
  equipmentModelId: number | "";
  manufacturerCompanyId: number | "";
  manufacturerCountryId: number | "";
  serialNumber?: string;
  inventoryNumber?: string;
  /** Creation only — changing it later goes through changeEquipmentLocation(). */
  airportId?: number;
  terminalId?: number;
  floorId?: number;
  zoneId?: number;
  location?: string;
  /** Creation only — changing it later goes through changeEquipmentOperatedBy(). */
  operatedById?: number | "";
  status?: EquipmentStatus;
  manufactureYear: number | "";
  purchaseYear?: number | "";
  commissioningYear?: number | "";
  serviceLifeExpiryYear?: number | "";
  lastInspectionAt?: string | null;
  nextInspectionAt?: string | null;
  notes?: string;
  regulationIds?: number[];
  /** undefined = leave unchanged (edit only), null = remove, File = replace/set */
  image?: File | null;
}

function buildFormData(input: Partial<EquipmentInput>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (key === "image" || key === "regulationIds") continue;
    if (value === undefined || value === null || value === "") continue;
    formData.set(key, String(value));
  }
  if (input.image instanceof File) {
    formData.set("image", input.image);
  }
  if (input.regulationIds) {
    for (const id of input.regulationIds) formData.append("regulationIds", String(id));
  }
  return formData;
}

// POST /equipment
export function createEquipment(input: EquipmentInput): Promise<Equipment> {
  if (input.image instanceof File) {
    return apiUpload<Equipment>("/equipment", buildFormData(input));
  }
  const { image: _image, ...rest } = input;
  return apiPost<Equipment>("/equipment", rest);
}

// PATCH /equipment/:id
export function updateEquipment(id: number, input: Partial<EquipmentInput>): Promise<Equipment> {
  if (input.image instanceof File) {
    return apiUpload<Equipment>(`/equipment/${id}`, buildFormData(input), "PATCH");
  }
  const { image: _image, ...rest } = input;
  return apiPatch<Equipment>(`/equipment/${id}`, rest);
}

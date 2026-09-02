import type {
  Equipment,
  EquipmentModel,
  EquipmentStatus,
  EquipmentType,
} from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiPost, apiDelete, apiUpload, apiDownload, type Page } from "./http-client";

export interface EquipmentFilters {
  airportId?: number;
  terminalId?: number;
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

// GET /equipment/export
export function exportEquipment(filters: EquipmentFilters = {}): Promise<void> {
  return apiDownload("/equipment/export", filters, "equipment.xlsx");
}

// PATCH /equipment/:id/status
export function updateEquipmentStatus(id: number, status: EquipmentStatus): Promise<Equipment> {
  return apiPatch<Equipment>(`/equipment/${id}/status`, { status });
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

export interface EquipmentInput {
  name: string;
  equipmentTypeId: number | "";
  equipmentModelId: number | "";
  manufacturerCompanyId: number | "";
  manufacturerCountryId: number | "";
  serialNumber?: string;
  inventoryNumber?: string;
  airportId: number;
  terminalId?: number;
  zoneId?: number;
  location?: string;
  operatedById: number | "";
  status?: EquipmentStatus;
  manufactureYear: number | "";
  purchaseYear?: number | "";
  commissioningYear?: number | "";
  serviceLifeExpiryYear?: number | "";
  lastInspectionAt?: string | null;
  nextInspectionAt?: string | null;
  notes?: string;
  /** undefined = leave unchanged (edit only), null = remove, File = replace/set */
  image?: File | null;
}

function buildFormData(input: Partial<EquipmentInput>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (key === "image") continue;
    if (value === undefined || value === null || value === "") continue;
    formData.set(key, String(value));
  }
  if (input.image instanceof File) {
    formData.set("image", input.image);
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

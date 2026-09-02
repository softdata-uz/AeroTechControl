import type { ChecklistItem, Inspection, InspectionStatus } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, type Page } from "./http-client";

export interface InspectionFilters {
  airportId?: number;
  equipmentId?: number;
  status?: InspectionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /inspections
export function listInspections(filters: InspectionFilters = {}): Promise<Page<Inspection>> {
  return apiGetPage<Inspection>("/inspections", filters);
}

// GET /equipment/:id/inspections
export function listInspectionsForEquipment(equipmentId: number): Promise<Inspection[]> {
  return apiGet<Inspection[]>(`/equipment/${equipmentId}/inspections`);
}

// GET /inspections/:id/checklist
export function getInspectionChecklist(inspectionId: number): Promise<ChecklistItem[]> {
  return apiGet<ChecklistItem[]>(`/inspections/${inspectionId}/checklist`);
}

// PATCH /inspections/:id/complete
export function completeInspection(
  id: number,
  result: NonNullable<Inspection["result"]>
): Promise<Inspection> {
  return apiPatch<Inspection>(`/inspections/${id}/complete`, { result });
}

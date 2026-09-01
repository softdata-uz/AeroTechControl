import type { Fault, FaultPriority, FaultStage } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiPost, type Page } from "./http-client";

export interface FaultFilters {
  airportId?: number;
  terminalId?: number;
  equipmentType?: string;
  equipmentId?: number;
  stage?: FaultStage;
  priority?: FaultPriority;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /faults
// Note: the backend filters by equipmentId/stage/priority/search/page/pageSize.
// airportId/terminalId/equipmentType are not backend query params (the Fault
// entity doesn't denormalize location) — callers that need those should
// filter the fetched equipment set first, or rely on useEquipmentLookup.
export function listFaults(filters: FaultFilters = {}): Promise<Page<Fault>> {
  const { equipmentId, stage, priority, search, page, pageSize } = filters;
  return apiGetPage<Fault>("/faults", { equipmentId, stage, priority, search, page, pageSize });
}

// GET /equipment/:id/faults
export function listFaultsForEquipment(equipmentId: number): Promise<Fault[]> {
  return apiGet<Fault[]>(`/equipment/${equipmentId}/faults`);
}

// GET /faults/:id
export function getFault(id: number): Promise<Fault> {
  return apiGet<Fault>(`/faults/${id}`);
}

// POST /faults
export function createFault(input: Omit<Fault, "id" | "code" | "detectedAt">): Promise<Fault> {
  return apiPost<Fault>("/faults", input);
}

// PATCH /faults/:id/stage
export function updateFaultStage(id: number, stage: FaultStage): Promise<Fault> {
  return apiPatch<Fault>(`/faults/${id}/stage`, { stage });
}

// PATCH /faults/:id/assignee
export function assignFault(id: number, assignee: string): Promise<Fault> {
  return apiPatch<Fault>(`/faults/${id}/assignee`, { assignee });
}

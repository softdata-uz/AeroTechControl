import type { Fault, FaultAttachment, FaultPriority, FaultStage } from "@/lib/types";
import {
  apiDelete,
  apiDownload,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiUpload,
  type Page,
} from "./http-client";

/** Server-enforced; mirrors MAX_ATTACHMENTS_PER_FAULT in the backend. */
export const MAX_FAULT_PHOTOS = 5;

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

// GET /faults/export?format=xlsx
export function exportFaults(filters: FaultFilters = {}): Promise<void> {
  const { equipmentId, stage, priority, search } = filters;
  return apiDownload(
    "/faults/export",
    { equipmentId, stage, priority, search, format: "xlsx" },
    "faults.xlsx"
  );
}

// POST /faults
// attachmentCount is excluded: the backend maintains it from the attachment
// endpoints and rejects the field outright (forbidNonWhitelisted).
export function createFault(
  input: Omit<Fault, "id" | "code" | "detectedAt" | "attachmentCount">
): Promise<Fault> {
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

// GET /faults/:id/attachments
export function listFaultAttachments(id: number): Promise<FaultAttachment[]> {
  return apiGet<FaultAttachment[]>(`/faults/${id}/attachments`);
}

// POST /faults/:id/attachments/batch — one request for up to MAX_FAULT_PHOTOS files.
export function uploadFaultAttachments(id: number, files: File[]): Promise<FaultAttachment[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return apiUpload<FaultAttachment[]>(`/faults/${id}/attachments/batch`, form);
}

// DELETE /faults/:id/attachments/:attachmentId
export function deleteFaultAttachment(id: number, attachmentId: number): Promise<void> {
  return apiDelete<void>(`/faults/${id}/attachments/${attachmentId}`);
}

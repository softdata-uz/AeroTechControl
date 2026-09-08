import type { ProcessSheet } from "@/lib/types";
import { apiGet, apiPatch, apiPost, apiDelete } from "./http-client";

// GET /process-sheets?regulationId=
export function list(regulationId?: number): Promise<ProcessSheet[]> {
  return apiGet<ProcessSheet[]>("/process-sheets", { regulationId });
}

// POST /process-sheets
export function create(input: { regulationId: number; name: string }): Promise<ProcessSheet> {
  return apiPost<ProcessSheet>("/process-sheets", input);
}

// PATCH /process-sheets/:id
export function update(
  id: number,
  input: { regulationId?: number; name?: string }
): Promise<ProcessSheet> {
  return apiPatch<ProcessSheet>(`/process-sheets/${id}`, input);
}

// DELETE /process-sheets/:id
export function remove(id: number): Promise<void> {
  return apiDelete<void>(`/process-sheets/${id}`);
}

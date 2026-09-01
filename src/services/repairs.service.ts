import type { Repair, RepairStatus } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, type Page } from "./http-client";

export interface RepairFilters {
  equipmentId?: number;
  faultId?: number;
  status?: RepairStatus;
  page?: number;
  pageSize?: number;
}

// GET /repairs
export function listRepairs(filters: RepairFilters = {}): Promise<Page<Repair>> {
  return apiGetPage<Repair>("/repairs", filters);
}

// GET /repairs/:id
export function getRepair(id: number): Promise<Repair> {
  return apiGet<Repair>(`/repairs/${id}`);
}

// PATCH /repairs/:id/status
export function updateRepairStatus(id: number, status: RepairStatus): Promise<Repair> {
  return apiPatch<Repair>(`/repairs/${id}/status`, { status });
}

// PATCH /repairs/:id/parts
export function addRepairPart(id: number, partName: string): Promise<Repair> {
  return apiPatch<Repair>(`/repairs/${id}/parts`, { partName });
}

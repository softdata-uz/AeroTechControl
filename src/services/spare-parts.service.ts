import type { SparePart, SparePartStatus } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiDownload, type Page } from "./http-client";

export interface SparePartFilters {
  warehouse?: string;
  status?: SparePartStatus;
  compatibleType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /spare-parts
export function listSpareParts(filters: SparePartFilters = {}): Promise<Page<SparePart>> {
  return apiGetPage<SparePart>("/spare-parts", filters);
}

// GET /spare-parts/:id
export function getSparePart(id: number): Promise<SparePart> {
  return apiGet<SparePart>(`/spare-parts/${id}`);
}

// GET /spare-parts/export
export function exportSpareParts(filters: SparePartFilters = {}): Promise<void> {
  return apiDownload("/spare-parts/export", filters, "spare-parts.xlsx");
}

// PATCH /spare-parts/:id/reserve
export function reserveSparePart(id: number, quantity: number): Promise<SparePart> {
  return apiPatch<SparePart>(`/spare-parts/${id}/reserve`, { quantity });
}

// PATCH /spare-parts/:id/consume
export function consumeSparePart(id: number, quantity: number): Promise<SparePart> {
  return apiPatch<SparePart>(`/spare-parts/${id}/consume`, { quantity });
}

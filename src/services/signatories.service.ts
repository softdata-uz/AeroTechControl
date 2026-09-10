import type { Signatory, SignatoryType } from "@/lib/types";
import { apiGet, apiPatch, apiPost, apiDelete } from "./http-client";

// GET /signatories?airportId=&type=
export function list(airportId?: number, type?: SignatoryType): Promise<Signatory[]> {
  return apiGet<Signatory[]>("/signatories", { airportId, type });
}

// POST /signatories
export function create(input: { airportId: number; fullName: string; type: SignatoryType }): Promise<Signatory> {
  return apiPost<Signatory>("/signatories", input);
}

// PATCH /signatories/:id
export function update(
  id: number,
  input: { airportId?: number; fullName?: string; type?: SignatoryType }
): Promise<Signatory> {
  return apiPatch<Signatory>(`/signatories/${id}`, input);
}

// DELETE /signatories/:id
export function remove(id: number): Promise<void> {
  return apiDelete<void>(`/signatories/${id}`);
}

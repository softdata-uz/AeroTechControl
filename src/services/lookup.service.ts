import { apiGet, apiPost, apiPatch, apiDelete } from "./http-client";

export interface Lookup {
  id: number;
  name: string;
}

export interface LookupInput {
  name: string;
}

/**
 * Shared list+create+update+delete client for the small reference tables
 * (manufacturer companies/countries, equipment operators). Each of these
 * lookups behaves identically on the backend (GET / + POST / + PATCH /:id
 * + DELETE /:id, duplicate-name rejected with 409, in-use rows rejected
 * with 409 on delete) — one factory instead of three near-identical files.
 */
export function createLookupService<T extends Lookup = Lookup>(basePath: string) {
  return {
    list(search?: string): Promise<T[]> {
      return apiGet<T[]>(basePath, search ? { search } : undefined);
    },
    create(input: LookupInput): Promise<T> {
      return apiPost<T>(basePath, input);
    },
    update(id: number, input: LookupInput): Promise<T> {
      return apiPatch<T>(`${basePath}/${id}`, input);
    },
    remove(id: number): Promise<void> {
      return apiDelete<void>(`${basePath}/${id}`);
    },
  };
}

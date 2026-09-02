import type { AppUser, UserRole } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, apiPost, apiUpload, apiDownload, type Page } from "./http-client";

export interface UserFilters {
  role?: UserRole;
  airportId?: number;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /users
export function listUsers(filters: UserFilters = {}): Promise<Page<AppUser>> {
  return apiGetPage<AppUser>("/users", filters);
}

// GET /users/:id
export function getUser(id: number): Promise<AppUser> {
  return apiGet<AppUser>(`/users/${id}`);
}

// GET /users/export
export function exportUsers(filters: UserFilters = {}): Promise<void> {
  return apiDownload("/users/export", filters, "users.xlsx");
}

// PATCH /users/:id/active
export function setUserActive(id: number, active: boolean): Promise<AppUser> {
  return apiPatch<AppUser>(`/users/${id}/active`, { active });
}

// PATCH /users/:id/role (administrator only)
export function setUserRole(id: number, role: UserRole): Promise<AppUser> {
  return apiPatch<AppUser>(`/users/${id}/role`, { role });
}

export interface UserInput {
  fullName: string;
  login: string;
  email?: string;
  password?: string;
  role: UserRole;
  airportId?: number | "";
  /** undefined = leave unchanged (edit only), null = remove, File = replace/set */
  image?: File | null;
}

function buildFormData(input: Partial<UserInput>): FormData {
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

// POST /users
export function createUser(input: UserInput): Promise<AppUser> {
  if (input.image instanceof File) {
    return apiUpload<AppUser>("/users", buildFormData(input));
  }
  const { image: _image, ...rest } = input;
  return apiPost<AppUser>("/users", rest);
}

// PATCH /users/:id
export function updateUser(id: number, input: Partial<UserInput>): Promise<AppUser> {
  if (input.image instanceof File) {
    return apiUpload<AppUser>(`/users/${id}`, buildFormData(input), "PATCH");
  }
  const { image: _image, ...rest } = input;
  return apiPatch<AppUser>(`/users/${id}`, rest);
}

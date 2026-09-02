import type { EquipmentDocument, DocumentStatus } from "@/lib/types";
import { apiGet, apiGetPage, apiUpload, type Page } from "./http-client";

export interface DocumentFilters {
  equipmentId?: number;
  type?: EquipmentDocument["type"];
  status?: DocumentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /documents
export function listDocuments(filters: DocumentFilters = {}): Promise<Page<EquipmentDocument>> {
  return apiGetPage<EquipmentDocument>("/documents", filters);
}

// GET /documents/:id
export function getDocument(id: string): Promise<EquipmentDocument> {
  return apiGet<EquipmentDocument>(`/documents/${id}`);
}

export interface CreateDocumentInput {
  equipmentId?: number | null;
  title: string;
  type: EquipmentDocument["type"];
  status?: DocumentStatus;
  author?: string;
  version?: string;
  file: File;
}

// POST /documents (multipart/form-data — the backend requires a real file)
export function createDocument(input: CreateDocumentInput): Promise<EquipmentDocument> {
  const formData = new FormData();
  if (input.equipmentId) formData.set("equipmentId", String(input.equipmentId));
  formData.set("title", input.title);
  formData.set("type", input.type);
  if (input.status) formData.set("status", input.status);
  if (input.author) formData.set("author", input.author);
  if (input.version) formData.set("version", input.version);
  formData.set("file", input.file);
  return apiUpload<EquipmentDocument>("/documents", formData);
}

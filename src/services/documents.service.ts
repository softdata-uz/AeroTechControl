import type { EquipmentDocument, DocumentStatus } from "@/lib/types";
import { documents as documentSeed, equipmentById } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface DocumentFilters {
  equipmentId?: string;
  type?: EquipmentDocument["type"];
  status?: DocumentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /documents
export function listDocuments(filters: DocumentFilters = {}): Promise<Page<EquipmentDocument>> {
  return resolve(() => {
    let items = documentSeed;
    if (filters.equipmentId) items = items.filter((d) => d.equipmentId === filters.equipmentId);
    if (filters.type) items = items.filter((d) => d.type === filters.type);
    if (filters.status) items = items.filter((d) => d.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((d) => {
        const eq = d.equipmentId ? equipmentById(d.equipmentId) : null;
        return (
          d.title.toLowerCase().includes(q) ||
          eq?.name.toLowerCase().includes(q) ||
          eq?.code.toLowerCase().includes(q)
        );
      });
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /documents/:id
export function getDocument(id: string): Promise<EquipmentDocument> {
  return resolve(() => documentSeed.find((d) => d.id === id)).then((d) => {
    if (!d) return reject(404, `Document ${id} not found`) as Promise<EquipmentDocument>;
    return d;
  });
}

// POST /documents  (metadata only — file upload is simulated client-side)
export function createDocument(input: Omit<EquipmentDocument, "id" | "date">): Promise<EquipmentDocument> {
  return mutate(() => {
    const doc: EquipmentDocument = {
      ...input,
      id: `doc-${String(documentSeed.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().slice(0, 10),
    };
    documentSeed.unshift(doc);
    return doc;
  });
}

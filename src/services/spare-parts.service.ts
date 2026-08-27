import type { SparePart, SparePartStatus } from "@/lib/types";
import { spareParts as sparePartSeed } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

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
  return resolve(() => {
    let items = sparePartSeed;
    if (filters.warehouse) items = items.filter((p) => p.warehouse === filters.warehouse);
    if (filters.status) items = items.filter((p) => p.status === filters.status);
    if (filters.compatibleType) {
      items = items.filter((p) => p.compatibleEquipmentTypes.includes(filters.compatibleType!));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /spare-parts/:id
export function getSparePart(id: string): Promise<SparePart> {
  return resolve(() => sparePartSeed.find((p) => p.id === id)).then((p) => {
    if (!p) return reject(404, `Spare part ${id} not found`) as Promise<SparePart>;
    return p;
  });
}

// PATCH /spare-parts/:id/reserve
export function reserveSparePart(id: string, quantity: number): Promise<SparePart> {
  return mutate(() => {
    const part = sparePartSeed.find((p) => p.id === id);
    if (!part) throw new Error(`Spare part ${id} not found`);
    part.reserved += quantity;
    if (part.stock - part.reserved <= 0) part.status = "out_of_stock";
    return part;
  });
}

// PATCH /spare-parts/:id/consume
export function consumeSparePart(id: string, quantity: number): Promise<SparePart> {
  return mutate(() => {
    const part = sparePartSeed.find((p) => p.id === id);
    if (!part) throw new Error(`Spare part ${id} not found`);
    part.stock = Math.max(0, part.stock - quantity);
    part.reserved = Math.max(0, part.reserved - quantity);
    part.status = part.stock === 0 ? "out_of_stock" : part.stock < part.minStock ? "low_stock" : "available";
    return part;
  });
}

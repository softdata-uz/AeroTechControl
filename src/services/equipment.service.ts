import type { Equipment, EquipmentStatus } from "@/lib/types";
import { equipment as equipmentSeed, equipmentById } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface EquipmentFilters {
  airportId?: string;
  terminalId?: string;
  zoneId?: string;
  type?: string;
  status?: EquipmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /equipment
export function listEquipment(filters: EquipmentFilters = {}): Promise<Page<Equipment>> {
  return resolve(() => {
    let items = equipmentSeed;
    if (filters.airportId) items = items.filter((e) => e.airportId === filters.airportId);
    if (filters.terminalId) items = items.filter((e) => e.terminalId === filters.terminalId);
    if (filters.zoneId) items = items.filter((e) => e.zoneId === filters.zoneId);
    if (filters.type) items = items.filter((e) => e.type === filters.type);
    if (filters.status) items = items.filter((e) => e.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.serialNumber.toLowerCase().includes(q) ||
          e.inventoryNumber.toLowerCase().includes(q)
      );
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /equipment/:id
export function getEquipment(id: string): Promise<Equipment> {
  return resolve(() => equipmentById(id)).then((eq) => {
    if (!eq) return reject(404, `Equipment ${id} not found`) as Promise<Equipment>;
    return eq;
  });
}

// PATCH /equipment/:id/status
export function updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
  return mutate(() => {
    const eq = equipmentById(id);
    if (!eq) throw new Error(`Equipment ${id} not found`);
    eq.status = status;
    return eq;
  });
}

// GET /equipment/types (distinct types for filter dropdowns)
export function listEquipmentTypes(): Promise<string[]> {
  return resolve(() => Array.from(new Set(equipmentSeed.map((e) => e.type))).sort());
}

import type { ChecklistItem, Inspection, InspectionStatus } from "@/lib/types";
import {
  inspections as inspectionSeed,
  inspectionsByEquipment,
  checklistForInspection,
  equipmentByAirport,
  equipmentById,
} from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface InspectionFilters {
  airportId?: string;
  equipmentId?: string;
  status?: InspectionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /inspections
export function listInspections(filters: InspectionFilters = {}): Promise<Page<Inspection>> {
  return resolve(() => {
    let items = inspectionSeed;
    if (filters.airportId) {
      const equipmentIds = new Set(equipmentByAirport(filters.airportId).map((e) => e.id));
      items = items.filter((i) => equipmentIds.has(i.equipmentId));
    }
    if (filters.equipmentId) items = items.filter((i) => i.equipmentId === filters.equipmentId);
    if (filters.status) items = items.filter((i) => i.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((i) => {
        const eq = equipmentById(i.equipmentId);
        return (
          i.id.toLowerCase().includes(q) ||
          eq?.name.toLowerCase().includes(q) ||
          eq?.code.toLowerCase().includes(q)
        );
      });
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /equipment/:id/inspections
export function listInspectionsForEquipment(equipmentId: string): Promise<Inspection[]> {
  return resolve(() => inspectionsByEquipment(equipmentId));
}

// GET /inspections/:id
export function getInspection(id: string): Promise<Inspection> {
  return resolve(() => inspectionSeed.find((i) => i.id === id)).then((insp) => {
    if (!insp) return reject(404, `Inspection ${id} not found`) as Promise<Inspection>;
    return insp;
  });
}

// GET /inspections/:id/checklist
export function getInspectionChecklist(inspectionId: string): Promise<ChecklistItem[]> {
  return resolve(() => checklistForInspection(inspectionId));
}

// PATCH /inspections/:id/checklist/:itemId
export function updateChecklistItem(
  inspectionId: string,
  itemId: string,
  patch: Partial<Pick<ChecklistItem, "result" | "comment">>
): Promise<ChecklistItem> {
  return mutate(() => {
    const items = checklistForInspection(inspectionId);
    const item = items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Checklist item ${itemId} not found`);
    return { ...item, ...patch };
  });
}

// PATCH /inspections/:id/complete
export function completeInspection(id: string, result: Inspection["result"]): Promise<Inspection> {
  return mutate(() => {
    const insp = inspectionSeed.find((i) => i.id === id);
    if (!insp) throw new Error(`Inspection ${id} not found`);
    insp.status = "completed";
    insp.completedAt = new Date().toISOString().slice(0, 10);
    insp.result = result;
    return insp;
  });
}

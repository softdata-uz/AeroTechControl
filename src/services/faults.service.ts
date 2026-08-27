import type { Fault, FaultPriority, FaultStage } from "@/lib/types";
import { faults as faultSeed, faultsByEquipment, faultById, equipmentByAirport } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface FaultFilters {
  airportId?: string;
  equipmentId?: string;
  stage?: FaultStage;
  priority?: FaultPriority;
  search?: string;
  page?: number;
  pageSize?: number;
}

// GET /faults
export function listFaults(filters: FaultFilters = {}): Promise<Page<Fault>> {
  return resolve(() => {
    let items = faultSeed;
    if (filters.airportId) {
      const equipmentIds = new Set(equipmentByAirport(filters.airportId).map((e) => e.id));
      items = items.filter((f) => equipmentIds.has(f.equipmentId));
    }
    if (filters.equipmentId) items = items.filter((f) => f.equipmentId === filters.equipmentId);
    if (filters.stage) items = items.filter((f) => f.stage === filters.stage);
    if (filters.priority) items = items.filter((f) => f.priority === filters.priority);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((f) => f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /equipment/:id/faults
export function listFaultsForEquipment(equipmentId: string): Promise<Fault[]> {
  return resolve(() => faultsByEquipment(equipmentId));
}

// GET /faults/:id
export function getFault(id: string): Promise<Fault> {
  return resolve(() => faultById(id)).then((f) => {
    if (!f) return reject(404, `Fault ${id} not found`) as Promise<Fault>;
    return f;
  });
}

// POST /faults
export function createFault(input: Omit<Fault, "id" | "detectedAt">): Promise<Fault> {
  return mutate(() => {
    const fault: Fault = {
      ...input,
      id: `INC-${String(faultSeed.length + 1).padStart(5, "0")}`,
      detectedAt: new Date().toISOString().slice(0, 10),
    };
    faultSeed.unshift(fault);
    return fault;
  });
}

// PATCH /faults/:id/stage
export function updateFaultStage(id: string, stage: FaultStage): Promise<Fault> {
  return mutate(() => {
    const fault = faultById(id);
    if (!fault) throw new Error(`Fault ${id} not found`);
    fault.stage = stage;
    return fault;
  });
}

// PATCH /faults/:id/assignee
export function assignFault(id: string, assignee: string): Promise<Fault> {
  return mutate(() => {
    const fault = faultById(id);
    if (!fault) throw new Error(`Fault ${id} not found`);
    fault.assignee = assignee;
    fault.stage = fault.stage === "registered" ? "assigned" : fault.stage;
    return fault;
  });
}

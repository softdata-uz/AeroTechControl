import type { Repair, RepairStatus } from "@/lib/types";
import { repairs as repairSeed, repairsByFault, repairById } from "@/lib/mock-data";
import { resolve, mutate, reject, paginate, type Page } from "./http-client";

export interface RepairFilters {
  equipmentId?: string;
  faultId?: string;
  status?: RepairStatus;
  page?: number;
  pageSize?: number;
}

// GET /repairs
export function listRepairs(filters: RepairFilters = {}): Promise<Page<Repair>> {
  return resolve(() => {
    let items = repairSeed;
    if (filters.equipmentId) items = items.filter((r) => r.equipmentId === filters.equipmentId);
    if (filters.faultId) items = items.filter((r) => r.faultId === filters.faultId);
    if (filters.status) items = items.filter((r) => r.status === filters.status);
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /faults/:id/repairs
export function listRepairsForFault(faultId: string): Promise<Repair[]> {
  return resolve(() => repairsByFault(faultId));
}

// GET /repairs/:id
export function getRepair(id: string): Promise<Repair> {
  return resolve(() => repairById(id)).then((r) => {
    if (!r) return reject(404, `Repair ${id} not found`) as Promise<Repair>;
    return r;
  });
}

// PATCH /repairs/:id/status
export function updateRepairStatus(id: string, status: RepairStatus): Promise<Repair> {
  return mutate(() => {
    const repair = repairById(id);
    if (!repair) throw new Error(`Repair ${id} not found`);
    repair.status = status;
    if (status === "completed" || status === "verified") {
      repair.completedAt = repair.completedAt ?? new Date().toISOString().slice(0, 10);
    }
    return repair;
  });
}

// PATCH /repairs/:id/parts
export function addRepairPart(id: string, partName: string): Promise<Repair> {
  return mutate(() => {
    const repair = repairById(id);
    if (!repair) throw new Error(`Repair ${id} not found`);
    repair.partsUsed = [...repair.partsUsed, partName];
    return repair;
  });
}

import type { Repair, RepairStatus } from "@/lib/types";
import { repairs as repairSeed } from "@/lib/mock-data";
import { resolve, paginate, type Page } from "./http-client";

export interface RepairFilters {
  equipmentId?: string;
  faultId?: string;
  status?: RepairStatus;
  page?: number;
  pageSize?: number;
}

// GET /repairs — the standalone Repairs page was removed; this now only
// backs the Faults page's "waiting for spare parts" KPI. That record type
// now lives under Documents (repair reports).
export function listRepairs(filters: RepairFilters = {}): Promise<Page<Repair>> {
  return resolve(() => {
    let items = repairSeed;
    if (filters.equipmentId) items = items.filter((r) => r.equipmentId === filters.equipmentId);
    if (filters.faultId) items = items.filter((r) => r.faultId === filters.faultId);
    if (filters.status) items = items.filter((r) => r.status === filters.status);
    return paginate(items, filters.page, filters.pageSize);
  });
}

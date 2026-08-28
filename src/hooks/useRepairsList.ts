"use client";

import { repairsService } from "@/services";
import type { RepairFilters } from "@/services/repairs.service";
import { useAsync } from "./useAsync";

export function useRepairsList(filters: RepairFilters) {
  return useAsync(() => repairsService.listRepairs(filters), [JSON.stringify(filters)]);
}

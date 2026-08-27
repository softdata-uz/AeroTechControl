"use client";

import { faultsService } from "@/services";
import type { FaultFilters } from "@/services/faults.service";
import { useAsync } from "./useAsync";

export function useFaultsList(filters: FaultFilters) {
  return useAsync(() => faultsService.listFaults(filters), [JSON.stringify(filters)]);
}

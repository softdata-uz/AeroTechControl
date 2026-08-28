"use client";

import { inspectionsService } from "@/services";
import type { InspectionFilters } from "@/services/inspections.service";
import { useAsync } from "./useAsync";

export function useInspectionsList(filters: InspectionFilters) {
  return useAsync(() => inspectionsService.listInspections(filters), [JSON.stringify(filters)]);
}

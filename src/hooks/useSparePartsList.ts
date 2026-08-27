"use client";

import { sparePartsService } from "@/services";
import type { SparePartFilters } from "@/services/spare-parts.service";
import { useAsync } from "./useAsync";

export function useSparePartsList(filters: SparePartFilters) {
  return useAsync(() => sparePartsService.listSpareParts(filters), [JSON.stringify(filters)]);
}

"use client";

import { equipmentService } from "@/services";
import type { EquipmentFilters } from "@/services/equipment.service";
import { useAsync } from "./useAsync";

export function useEquipmentList(filters: EquipmentFilters) {
  return useAsync(() => equipmentService.listEquipment(filters), [JSON.stringify(filters)]);
}

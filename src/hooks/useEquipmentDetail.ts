"use client";

import { equipmentService, faultsService, inspectionsService } from "@/services";
import { useAsync } from "./useAsync";

export function useEquipmentDetail(equipmentId: string) {
  return useAsync(() => equipmentService.getEquipment(equipmentId), [equipmentId]);
}

export function useEquipmentInspectionHistory(equipmentId: string) {
  return useAsync(() => inspectionsService.listInspectionsForEquipment(equipmentId), [equipmentId]);
}

export function useEquipmentFaultHistory(equipmentId: string) {
  return useAsync(() => faultsService.listFaultsForEquipment(equipmentId), [equipmentId]);
}

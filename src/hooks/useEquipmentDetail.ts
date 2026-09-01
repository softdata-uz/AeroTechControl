"use client";

import { equipmentService, faultsService, inspectionsService } from "@/services";
import { useAsync } from "./useAsync";

export function useEquipmentDetail(equipmentId: number) {
  return useAsync(() => equipmentService.getEquipment(equipmentId), [equipmentId]);
}

export function useEquipmentInspectionHistory(equipmentId: number) {
  return useAsync(() => inspectionsService.listInspectionsForEquipment(equipmentId), [equipmentId]);
}

export function useEquipmentFaultHistory(equipmentId: number) {
  return useAsync(() => faultsService.listFaultsForEquipment(equipmentId), [equipmentId]);
}

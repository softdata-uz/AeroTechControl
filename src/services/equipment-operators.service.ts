import type { EquipmentOperator } from "@/lib/types";
import { createLookupService } from "./lookup.service";

export const equipmentOperatorsApi = createLookupService<EquipmentOperator>(
  "/equipment-operators"
);

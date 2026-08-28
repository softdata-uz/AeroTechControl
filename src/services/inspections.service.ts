import type { Inspection } from "@/lib/types";
import { inspectionsByEquipment } from "@/lib/mock-data";
import { resolve } from "./http-client";

// GET /equipment/:id/inspections — the only inspection data the frontend
// still consumes, on the Equipment Detail page's Inspection History tab.
// The standalone Inspections page (and its list/checklist endpoints) was
// removed; that record type now lives under Documents (acts).
export function listInspectionsForEquipment(equipmentId: string): Promise<Inspection[]> {
  return resolve(() => inspectionsByEquipment(equipmentId));
}

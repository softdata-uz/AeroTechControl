import type { Equipment, EquipmentDocument } from "@/lib/types";
import { equipment as equipmentSeed, documents as documentSeed, equipmentByAirport } from "@/lib/mock-data";
import { resolve, paginate, type Page } from "./http-client";

// Calibration/verification is derived from the equipment lifecycle (its
// inspection dates and any linked certificate) rather than a separate
// entity — per CLAUDE.md §26, this module stays connected to equipment,
// not an isolated record type.

export type CalibrationStatus = "overdue" | "upcoming" | "planned";

export interface CalibrationRecord {
  equipment: Equipment;
  status: CalibrationStatus;
  certificate: EquipmentDocument | null;
}

export interface CalibrationFilters {
  airportId?: string;
  status?: CalibrationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

const TODAY = "2026-08-25";
const IN_30_DAYS = "2026-09-24";

function statusFor(nextDate: string | null): CalibrationStatus {
  if (!nextDate) return "planned";
  if (nextDate < TODAY) return "overdue";
  if (nextDate <= IN_30_DAYS) return "upcoming";
  return "planned";
}

function buildRecords(): CalibrationRecord[] {
  return equipmentSeed.map((eq) => ({
    equipment: eq,
    status: statusFor(eq.nextInspectionAt),
    certificate: documentSeed.find((d) => d.equipmentId === eq.id && d.type === "certificate") ?? null,
  }));
}

// GET /calibration
export function listCalibrationRecords(filters: CalibrationFilters = {}): Promise<Page<CalibrationRecord>> {
  return resolve(() => {
    let items = buildRecords();
    if (filters.airportId) {
      const equipmentIds = new Set(equipmentByAirport(filters.airportId).map((e) => e.id));
      items = items.filter((r) => equipmentIds.has(r.equipment.id));
    }
    if (filters.status) items = items.filter((r) => r.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) => r.equipment.name.toLowerCase().includes(q) || r.equipment.code.toLowerCase().includes(q)
      );
    }
    return paginate(items, filters.page, filters.pageSize);
  });
}

import type { Equipment, EquipmentDocument } from "@/lib/types";
import { listEquipment } from "./equipment.service";
import { listDocuments } from "./documents.service";
import { paginate, type Page } from "./http-client";

// Calibration/verification is derived from the equipment lifecycle (its
// inspection dates and any linked certificate) rather than a separate
// backend entity — per the backend's API contract, this stays a client-side
// view computed from real equipment + document data, not an isolated
// record type.

export type CalibrationStatus = "overdue" | "upcoming" | "planned";

export interface CalibrationRecord {
  equipment: Equipment;
  status: CalibrationStatus;
  certificate: EquipmentDocument | null;
}

export interface CalibrationFilters {
  airportId?: number;
  status?: CalibrationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function statusFor(nextDate: string | null): CalibrationStatus {
  if (!nextDate) return "planned";
  const today = new Date().toISOString().slice(0, 10);
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (nextDate < today) return "overdue";
  if (nextDate <= in30Days) return "upcoming";
  return "planned";
}

async function buildRecords(airportId?: number): Promise<CalibrationRecord[]> {
  const [equipmentPage, documentsPage] = await Promise.all([
    listEquipment({ airportId, pageSize: 200 }),
    listDocuments({ type: "certificate", pageSize: 200 }),
  ]);

  return equipmentPage.items.map((eq) => ({
    equipment: eq,
    status: statusFor(eq.nextInspectionAt),
    certificate: documentsPage.items.find((d) => d.equipmentId === eq.id) ?? null,
  }));
}

// Derived view — GET /equipment + GET /documents, computed client-side.
export async function listCalibrationRecords(
  filters: CalibrationFilters = {}
): Promise<Page<CalibrationRecord>> {
  let items = await buildRecords(filters.airportId);
  if (filters.status) items = items.filter((r) => r.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (r) => r.equipment.name.toLowerCase().includes(q) || r.equipment.code.toLowerCase().includes(q)
    );
  }
  return paginate(items, filters.page, filters.pageSize);
}

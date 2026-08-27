import type { Airport } from "@/lib/types";
import { equipment, faults, repairs, inspections, spareParts, airports } from "@/lib/mock-data";
import { resolve } from "./http-client";

export type ReportPeriod = "30d" | "90d" | "year";

export interface ReportsSummary {
  total: number;
  operational: number;
  faulty: number;
  underRepair: number;
  overdueInspections: number;
  upcomingInspections: number;
  mttrHours: number;
  mttrSampleSize: number;
  mtbfHours: number;
  byTypeFaultCount: [string, number][];
  partsConsumption: [string, number][];
  complianceByAirport: { airport: Airport; pct: number; count: number }[];
  dailyFaults: { date: string; value: number }[];
  radarSeries: { name: string; values: number[] }[];
}

const TODAY = "2026-08-25";

function periodStartDate(period: ReportPeriod): string {
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// GET /reports/summary?period=30d
export function getReportsSummary(period: ReportPeriod = "30d"): Promise<ReportsSummary> {
  return resolve(() => {
    const cutoff = periodStartDate(period);

    // Fleet snapshot — current state, not windowed by period.
    const total = equipment.length;
    const operational = equipment.filter((e) => e.status === "operational").length;
    const faulty = equipment.filter((e) => e.status === "faulty").length;
    const underRepair = equipment.filter((e) => e.status === "maintenance").length;

    // Inspection backlog — current state, not windowed by period.
    const overdueInspections = inspections.filter(
      (i) => i.status === "overdue" || (i.status === "planned" && i.scheduledAt < TODAY)
    ).length;
    const upcomingInspections = inspections.filter((i) => i.status === "planned").length;

    // Trend/history metrics — windowed to the selected reporting period.
    const periodFaults = faults.filter((f) => f.detectedAt >= cutoff);
    const periodRepairs = repairs.filter((r) => r.startedAt >= cutoff);

    const completedRepairs = periodRepairs.filter((r) => r.actualHours != null);
    const mttrHours = completedRepairs.length
      ? Math.round(
          (completedRepairs.reduce((sum, r) => sum + (r.actualHours ?? 0), 0) / completedRepairs.length) * 10
        ) / 10
      : 0;

    // Illustrative MTBF: total fleet-hours in the reporting period / number of faults.
    const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const fleetHoursInPeriod = total * 24 * days;
    const mtbfHours = periodFaults.length
      ? Math.round(fleetHoursInPeriod / periodFaults.length)
      : fleetHoursInPeriod;

    const byTypeFaultCount = Object.entries(
      periodFaults.reduce<Record<string, number>>((acc, f) => {
        const type = equipment.find((e) => e.id === f.equipmentId)?.type ?? "Прочее";
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]) as [string, number][];

    const partsConsumption = Object.entries(
      periodRepairs
        .flatMap((r) => r.partsUsed)
        .reduce<Record<string, number>>((acc, part) => {
          acc[part] = (acc[part] ?? 0) + 1;
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]) as [string, number][];

    // Compliance by airport — current fleet state, not windowed by period.
    const complianceByAirport = airports
      .map((a) => {
        const items = equipment.filter((e) => e.airportId === a.id);
        const ok = items.filter((e) => e.status === "operational" || e.status === "reserve").length;
        return {
          airport: a,
          pct: items.length ? Math.round((ok / items.length) * 100) : 0,
          count: items.length,
        };
      })
      .sort((a, b) => b.pct - a.pct);

    // Daily fault volume across the dates actually present within the period.
    const faultDates = [...new Set(periodFaults.map((f) => f.detectedAt))].sort();
    const dailyFaults = faultDates.map((date) => ({
      date,
      value: periodFaults.filter((f) => f.detectedAt === date).length,
    }));

    // Compliance dimensions per airport, top 3 by equipment count.
    const radarAirports = [...airports]
      .sort(
        (a, b) =>
          equipment.filter((e) => e.airportId === b.id).length -
          equipment.filter((e) => e.airportId === a.id).length
      )
      .slice(0, 3);
    const radarSeries = radarAirports.map((a) => {
      const items = equipment.filter((e) => e.airportId === a.id);
      const airportFaults = periodFaults.filter((f) => items.some((e) => e.id === f.equipmentId));
      const airportInspections = inspections.filter((i) => items.some((e) => e.id === i.equipmentId));
      const operationalPct = items.length
        ? Math.round(
            (items.filter((e) => e.status === "operational" || e.status === "reserve").length / items.length) * 100
          )
        : 0;
      const onTime = airportInspections.length
        ? Math.round((airportInspections.filter((i) => i.status !== "overdue").length / airportInspections.length) * 100)
        : 100;
      const resolved = airportFaults.length
        ? Math.round((airportFaults.filter((f) => f.stage === "closed").length / airportFaults.length) * 100)
        : 100;
      return { name: a.city, values: [operationalPct, onTime, resolved] };
    });

    return {
      total,
      operational,
      faulty,
      underRepair,
      overdueInspections,
      upcomingInspections,
      mttrHours,
      mttrSampleSize: completedRepairs.length,
      mtbfHours,
      byTypeFaultCount,
      partsConsumption,
      complianceByAirport,
      dailyFaults,
      radarSeries,
    };
  });
}

// Synchronous lookup helper (like equipmentById/airportName) — annotates
// parts-consumption rows with current stock; not a paginated endpoint.
export function getSparePartStockByName(name: string): number | undefined {
  return spareParts.find((p) => p.name === name)?.stock;
}

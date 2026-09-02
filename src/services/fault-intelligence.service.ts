import type { FaultPriority } from "@/lib/types";
import {
  equipment,
  faults,
  repairs,
  inspections,
  airports,
  terminals,
  zones,
  repairsByFault,
  airportName,
} from "@/lib/mock-data";
import { resolve } from "./http-client";

export type FaultAnalyticsWindow = "7d" | "30d" | "90d";

export interface FaultIntelligenceScope {
  airportId?: string;
  terminalId?: string;
}

export interface FaultKPISet {
  openFaults: number;
  criticalFaults: number;
  avgResolutionHours: number;
  avgResolutionSampleSize: number;
  repeatFaultRatePct: number;
}

export interface CategoryBreakdownEntry {
  category: string;
  count: number;
  pct: number;
}

export interface SeverityBreakdownEntry {
  priority: FaultPriority;
  count: number;
  pct: number;
}

export interface FaultTrendPoint {
  date: string;
  total: number;
  critical: number;
  resolved: number;
}

export interface FaultIntelligenceSummary {
  kpis: FaultKPISet;
  byCategory: CategoryBreakdownEntry[];
  bySeverity: SeverityBreakdownEntry[];
  trend: FaultTrendPoint[];
}

export interface HealthEntity {
  id: string;
  kind: "airport" | "terminal" | "zone";
  name: string;
  airportId: string;
  terminalId?: string;
  zoneId?: string;
  equipmentCount: number;
  faultCount7d: number;
  faultCountPrev7d: number;
  faultCount30d: number;
  criticalOpenCount: number;
  healthScore: number;
  dominantCategory: string | null;
}

export interface HealthInsight {
  id: string;
  entity: HealthEntity;
  kind: "spike" | "risk";
  message: string;
  deltaPct: number | null;
  recommendedAction: string;
}

export interface HealthSummary {
  entities: HealthEntity[];
  insights: HealthInsight[];
  maintenanceRiskCount: number;
}

const TODAY = "2026-08-25";

function windowDays(window: FaultAnalyticsWindow): number {
  return window === "7d" ? 7 : window === "90d" ? 90 : 30;
}

function daysAgoIso(days: number): string {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 3_600_000;
}

function scopedEquipmentIds(scope?: FaultIntelligenceScope): Set<string> {
  const items = equipment.filter(
    (e) =>
      (!scope?.airportId || e.airportId === scope.airportId) &&
      (!scope?.terminalId || e.terminalId === scope.terminalId)
  );
  return new Set(items.map((e) => e.id));
}

/**
 * GET /fault-intelligence/summary?window=30d&airportId=&terminalId=
 * Aggregates fault KPIs, category/severity breakdowns, and a daily trend
 * over the given window. `openFaults`/`criticalFaults` are current-state
 * snapshots (not windowed), matching the convention already used by
 * `reports.service.ts` for fleet-level counts; everything else — resolution
 * time, repeat-fault rate, breakdowns, trend — is windowed.
 */
export function getFaultIntelligenceSummary(
  window: FaultAnalyticsWindow = "30d",
  scope?: FaultIntelligenceScope
): Promise<FaultIntelligenceSummary> {
  return resolve(() => {
    const scopedIds = scopedEquipmentIds(scope);
    const scopedFaults = faults.filter((f) => scopedIds.has(f.equipmentId));
    const scopedRepairs = repairs.filter((r) => scopedIds.has(r.equipmentId));

    const openFaults = scopedFaults.filter((f) => f.stage !== "closed").length;
    const criticalFaults = scopedFaults.filter((f) => f.priority === "critical" && f.stage !== "closed").length;

    const days = windowDays(window);
    const cutoff = daysAgoIso(days);
    const periodFaults = scopedFaults.filter((f) => f.detectedAt >= cutoff);

    // Average resolution time — derived via the linked Repair, since Fault
    // has no `resolvedAt` of its own (same indirection reports.service.ts
    // uses for mttrHours).
    const resolutionSamples = periodFaults
      .filter((f) => f.stage === "closed")
      .map((f) => repairsByFault(f.id).find((r) => r.completedAt != null))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => hoursBetween(faults.find((f) => f.id === r.faultId)!.detectedAt, r.completedAt!));
    const avgResolutionHours = resolutionSamples.length
      ? Math.round((resolutionSamples.reduce((s, h) => s + h, 0) / resolutionSamples.length) * 10) / 10
      : 0;

    // Repeat-fault rate — illustrative: share of equipment units (among
    // those with any fault in the window) that had >=2 faults in the SAME
    // category within the window.
    const faultsByEquipmentInWindow = new Map<string, typeof periodFaults>();
    for (const f of periodFaults) {
      const list = faultsByEquipmentInWindow.get(f.equipmentId) ?? [];
      list.push(f);
      faultsByEquipmentInWindow.set(f.equipmentId, list);
    }
    let repeatOffenders = 0;
    for (const list of faultsByEquipmentInWindow.values()) {
      const byCategory = new Map<string, number>();
      for (const f of list) byCategory.set(f.category, (byCategory.get(f.category) ?? 0) + 1);
      if ([...byCategory.values()].some((n) => n >= 2)) repeatOffenders += 1;
    }
    const equipmentWithAnyFault = faultsByEquipmentInWindow.size;
    const repeatFaultRatePct = equipmentWithAnyFault
      ? Math.round((repeatOffenders / equipmentWithAnyFault) * 1000) / 10
      : 0;

    const byCategory: CategoryBreakdownEntry[] = Object.entries(
      periodFaults.reduce<Record<string, number>>((acc, f) => {
        acc[f.category] = (acc[f.category] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([category, count]) => ({ category, count, pct: 0 }))
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({ ...entry, pct: periodFaults.length ? Math.round((entry.count / periodFaults.length) * 100) : 0 }));

    const priorityOrder: FaultPriority[] = ["critical", "high", "medium", "low"];
    const bySeverity: SeverityBreakdownEntry[] = priorityOrder
      .map((priority) => ({
        priority,
        count: periodFaults.filter((f) => f.priority === priority).length,
      }))
      .filter((entry) => entry.count > 0)
      .map((entry) => ({ ...entry, pct: periodFaults.length ? Math.round((entry.count / periodFaults.length) * 100) : 0 }));

    const trend: FaultTrendPoint[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = daysAgoIso(i);
      trend.push({
        date,
        total: periodFaults.filter((f) => f.detectedAt === date).length,
        critical: periodFaults.filter((f) => f.detectedAt === date && f.priority === "critical").length,
        resolved: scopedRepairs.filter((r) => r.completedAt === date).length,
      });
    }

    return {
      kpis: { openFaults, criticalFaults, avgResolutionHours, avgResolutionSampleSize: resolutionSamples.length, repeatFaultRatePct },
      byCategory,
      bySeverity,
      trend,
    };
  });
}

function faultCountForEquipment(equipmentIds: Set<string>, sinceDate: string, beforeDate?: string): number {
  return faults.filter(
    (f) => equipmentIds.has(f.equipmentId) && f.detectedAt >= sinceDate && (!beforeDate || f.detectedAt < beforeDate)
  ).length;
}

function dominantCategoryFor(equipmentIds: Set<string>, sinceDate: string): string | null {
  const counts = new Map<string, number>();
  for (const f of faults) {
    if (!equipmentIds.has(f.equipmentId) || f.detectedAt < sinceDate) continue;
    counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }
  return best;
}

function healthScoreFor(equipmentIds: Set<string>): number {
  const items = equipment.filter((e) => equipmentIds.has(e.id));
  if (items.length === 0) return 100;

  const faultCount30d = faultCountForEquipment(equipmentIds, daysAgoIso(30));
  const criticalOpen = faults.filter(
    (f) => equipmentIds.has(f.equipmentId) && f.priority === "critical" && f.stage !== "closed"
  ).length;
  const overdue = inspections.filter(
    (i) => items.some((e) => e.id === i.equipmentId) && (i.status === "overdue" || (i.status === "planned" && i.scheduledAt < TODAY))
  ).length;

  const densityPenalty = Math.min(60, (faultCount30d / items.length) * 20);
  const criticalPenalty = Math.min(30, criticalOpen * 15);
  const overduePenalty = Math.min(20, overdue * 10);
  return Math.max(0, Math.round(100 - (densityPenalty + criticalPenalty + overduePenalty)));
}

function buildEntity(
  kind: HealthEntity["kind"],
  id: string,
  name: string,
  airportId: string,
  equipmentIds: Set<string>,
  extra: Partial<Pick<HealthEntity, "terminalId" | "zoneId">> = {}
): HealthEntity {
  return {
    id,
    kind,
    name,
    airportId,
    ...extra,
    equipmentCount: equipmentIds.size,
    faultCount7d: faultCountForEquipment(equipmentIds, daysAgoIso(7)),
    faultCountPrev7d: faultCountForEquipment(equipmentIds, daysAgoIso(14), daysAgoIso(7)),
    faultCount30d: faultCountForEquipment(equipmentIds, daysAgoIso(30)),
    criticalOpenCount: faults.filter(
      (f) => equipmentIds.has(f.equipmentId) && f.priority === "critical" && f.stage !== "closed"
    ).length,
    healthScore: healthScoreFor(equipmentIds),
    dominantCategory: dominantCategoryFor(equipmentIds, daysAgoIso(7)),
  };
}

function categoryLabelForAction(category: string | null): string {
  if (!category) return "оборудования";
  const map: Record<string, string> = {
    "Электроника": "электронных блоков",
    "Механика": "механических узлов",
    "Оптика/Датчики": "оптических датчиков",
    "Электропитание": "цепей электропитания",
    "Калибровка": "калибровочных параметров",
    "ПО": "программного обеспечения",
  };
  return map[category] ?? "оборудования";
}

/**
 * GET /fault-intelligence/health?airportId=
 * Rolls fault/inspection data up to airport/terminal/zone level and derives
 * human-readable insight callouts from real week-over-week deltas — no
 * hardcoded narrative, everything is computed from `equipment`/`faults`.
 */
export function getHealthSummary(scope?: { airportId?: string }): Promise<HealthSummary> {
  return resolve(() => {
    const scopedAirports = scope?.airportId ? airports.filter((a) => a.id === scope.airportId) : airports;
    const scopedTerminals = terminals.filter((t) => scopedAirports.some((a) => a.id === t.airportId));
    const scopedZones = zones.filter((z) => scopedTerminals.some((t) => t.id === z.terminalId));

    const airportEntities = scopedAirports.map((a) =>
      buildEntity(
        "airport",
        a.id,
        a.name,
        a.id,
        new Set(equipment.filter((e) => e.airportId === a.id).map((e) => e.id))
      )
    );
    const terminalEntities = scopedTerminals.map((t) =>
      buildEntity(
        "terminal",
        t.id,
        t.name,
        t.airportId,
        new Set(equipment.filter((e) => e.terminalId === t.id).map((e) => e.id)),
        { terminalId: t.id }
      )
    );
    const zoneEntities = scopedZones.map((z) => {
      const terminal = terminals.find((t) => t.id === z.terminalId)!;
      return buildEntity(
        "zone",
        z.id,
        z.name,
        terminal.airportId,
        new Set(equipment.filter((e) => e.zoneId === z.id).map((e) => e.id)),
        { terminalId: terminal.id, zoneId: z.id }
      );
    });

    const entities = [...airportEntities, ...terminalEntities, ...zoneEntities]
      .filter((e) => e.equipmentCount > 0)
      .sort((a, b) => a.healthScore - b.healthScore);

    const insights: HealthInsight[] = [];
    for (const zone of zoneEntities) {
      if (zone.equipmentCount === 0) continue;
      const grewEnough =
        zone.faultCount7d >= 2 &&
        (zone.faultCountPrev7d === 0 ? zone.faultCount7d >= 2 : zone.faultCount7d > zone.faultCountPrev7d * 1.2);
      if (!grewEnough) continue;
      const deltaPct = zone.faultCountPrev7d > 0 ? Math.round(((zone.faultCount7d - zone.faultCountPrev7d) / zone.faultCountPrev7d) * 100) : null;
      const deltaText = deltaPct != null ? `на ${deltaPct}%` : `с ${zone.faultCountPrev7d} до ${zone.faultCount7d}`;
      const zoneLabel = `${zone.name} (${airportName(zone.airportId)})`;
      insights.push({
        id: `spike-${zone.id}`,
        entity: zone,
        kind: "spike",
        message: `Оборудование зоны «${zoneLabel}» показало рост числа неисправностей ${deltaText} за последние 7 дней. Основная категория: ${zone.dominantCategory ?? "не определена"}.`,
        deltaPct,
        recommendedAction: `Проверить группу ${categoryLabelForAction(zone.dominantCategory)} в зоне «${zoneLabel}».`,
      });
    }
    for (const entity of [...terminalEntities, ...zoneEntities]) {
      if (entity.healthScore >= 50) continue;
      const entityLabel = `${entity.name} (${airportName(entity.airportId)})`;
      insights.push({
        id: `risk-${entity.id}`,
        entity,
        kind: "risk",
        message: `${entity.kind === "terminal" ? "Терминал" : "Зона"} «${entityLabel}» имеет повышенный риск обслуживания (индекс состояния ${entity.healthScore}).`,
        deltaPct: null,
        recommendedAction: `Запланировать внеплановую проверку оборудования в «${entityLabel}».`,
      });
    }
    insights.sort((a, b) => a.entity.healthScore - b.entity.healthScore);

    const maintenanceRiskCount = equipment.filter((e) => {
      const overdue = e.nextInspectionAt != null && e.nextInspectionAt < TODAY;
      const openFaults30d = faults.filter(
        (f) => f.equipmentId === e.id && f.stage !== "closed" && f.detectedAt >= daysAgoIso(30)
      ).length;
      return overdue || openFaults30d >= 2;
    }).length;

    return { entities, insights: insights.slice(0, 8), maintenanceRiskCount };
  });
}

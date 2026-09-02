import type { Airport, Equipment, Fault, FaultPriority, Inspection, Repair, Terminal, Zone } from "@/lib/types";
import { listFaults } from "./faults.service";
import { listRepairs } from "./repairs.service";
import { listEquipment } from "./equipment.service";
import { listInspections } from "./inspections.service";
import { listAirports, listAllTerminals, listAllZones } from "./airports.service";

// The backend has no dedicated analytics endpoint for fault-intelligence
// (unlike /reports/summary, which the backend computes server-side) and no
// date-range/pageSize>200 query support on /faults, /repairs, /inspections
// (http-client.ts clamps pageSize to MAX_PAGE_SIZE=200) — so this service
// fetches the same bounded "everything" pages the rest of the app already
// relies on (see useEquipmentLookup, FaultsClient's KPI row) and computes
// the aggregates client-side. If the fleet grows past ~200 records these
// numbers become a sample, not a true total; a real `/analytics` endpoint
// would remove that ceiling.
const FETCH_LIMIT = 200;

export type FaultAnalyticsWindow = "7d" | "30d" | "90d";

export interface FaultIntelligenceScope {
  airportId?: number;
  terminalId?: number;
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
  airportId: number;
  terminalId?: number;
  zoneId?: number;
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

interface RawData {
  faults: Fault[];
  repairs: Repair[];
  equipment: Equipment[];
  inspections: Inspection[];
  airports: Airport[];
  terminals: Terminal[];
  zones: Zone[];
}

async function fetchAll(): Promise<RawData> {
  const [faultsPage, repairsPage, equipmentPage, inspectionsPage, airports, terminals, zones] = await Promise.all([
    listFaults({ pageSize: FETCH_LIMIT }),
    listRepairs({ pageSize: FETCH_LIMIT }),
    listEquipment({ pageSize: FETCH_LIMIT }),
    listInspections({ pageSize: FETCH_LIMIT }),
    listAirports(),
    listAllTerminals(),
    listAllZones(),
  ]);
  return {
    faults: faultsPage.items,
    repairs: repairsPage.items,
    equipment: equipmentPage.items,
    inspections: inspectionsPage.items,
    airports,
    terminals,
    zones,
  };
}

function windowDays(window: FaultAnalyticsWindow): number {
  return window === "7d" ? 7 : window === "90d" ? 90 : 30;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function hoursBetween(fromIso: string, toIso: string): number {
  return (new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 3_600_000;
}

function scopedEquipmentIds(equipment: Equipment[], scope?: FaultIntelligenceScope): Set<number> {
  const items = equipment.filter(
    (e) =>
      (!scope?.airportId || e.airport.id === scope.airportId) &&
      (!scope?.terminalId || e.terminal?.id === scope.terminalId)
  );
  return new Set(items.map((e) => e.id));
}

/**
 * Aggregates fault KPIs, category/severity breakdowns, and a daily trend
 * over the given window. `openFaults`/`criticalFaults` are current-state
 * snapshots (not windowed); everything else — resolution time, repeat-fault
 * rate, breakdowns, trend — is windowed.
 */
export async function getFaultIntelligenceSummary(
  window: FaultAnalyticsWindow = "30d",
  scope?: FaultIntelligenceScope
): Promise<FaultIntelligenceSummary> {
  const { faults, repairs, equipment } = await fetchAll();
  const scopedIds = scopedEquipmentIds(equipment, scope);
  const scopedFaults = faults.filter((f) => scopedIds.has(f.equipmentId));
  const scopedRepairs = repairs.filter((r) => scopedIds.has(r.equipmentId));

  const openFaults = scopedFaults.filter((f) => f.stage !== "closed").length;
  const criticalFaults = scopedFaults.filter((f) => f.priority === "critical" && f.stage !== "closed").length;

  const days = windowDays(window);
  const cutoff = daysAgoIso(days);
  const periodFaults = scopedFaults.filter((f) => f.detectedAt >= cutoff);

  // Average resolution time — derived via the linked Repair, since Fault
  // has no `resolvedAt` of its own.
  const resolutionSamples = periodFaults
    .filter((f) => f.stage === "closed")
    .map((f) => repairs.find((r) => r.faultId === f.id && r.completedAt != null))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => hoursBetween(faults.find((f) => f.id === r.faultId)!.detectedAt, r.completedAt!));
  const avgResolutionHours = resolutionSamples.length
    ? Math.round((resolutionSamples.reduce((s, h) => s + h, 0) / resolutionSamples.length) * 10) / 10
    : 0;

  // Repeat-fault rate — illustrative: share of equipment units (among
  // those with any fault in the window) that had >=2 faults in the SAME
  // category within the window.
  const faultsByEquipmentInWindow = new Map<number, Fault[]>();
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

  const categoryCounts = periodFaults.reduce<Record<string, number>>((acc, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1;
    return acc;
  }, {});
  const byCategory: CategoryBreakdownEntry[] = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      pct: periodFaults.length ? Math.round((count / periodFaults.length) * 100) : 0,
    }));

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
}

function faultCountForEquipment(faults: Fault[], equipmentIds: Set<number>, sinceDate: string, beforeDate?: string): number {
  return faults.filter(
    (f) => equipmentIds.has(f.equipmentId) && f.detectedAt >= sinceDate && (!beforeDate || f.detectedAt < beforeDate)
  ).length;
}

function dominantCategoryFor(faults: Fault[], equipmentIds: Set<number>, sinceDate: string): string | null {
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

function healthScoreFor(faults: Fault[], inspections: Inspection[], equipment: Equipment[], equipmentIds: Set<number>): number {
  const items = equipment.filter((e) => equipmentIds.has(e.id));
  if (items.length === 0) return 100;

  const faultCount30d = faultCountForEquipment(faults, equipmentIds, daysAgoIso(30));
  const criticalOpen = faults.filter(
    (f) => equipmentIds.has(f.equipmentId) && f.priority === "critical" && f.stage !== "closed"
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = inspections.filter(
    (i) =>
      items.some((e) => e.id === i.equipmentId) &&
      (i.status === "overdue" || (i.status === "planned" && i.scheduledAt < today))
  ).length;

  const densityPenalty = Math.min(60, (faultCount30d / items.length) * 20);
  const criticalPenalty = Math.min(30, criticalOpen * 15);
  const overduePenalty = Math.min(20, overdue * 10);
  return Math.max(0, Math.round(100 - (densityPenalty + criticalPenalty + overduePenalty)));
}

function buildEntity(
  raw: RawData,
  kind: HealthEntity["kind"],
  id: string,
  name: string,
  airportId: number,
  equipmentIds: Set<number>,
  extra: Partial<Pick<HealthEntity, "terminalId" | "zoneId">> = {}
): HealthEntity {
  return {
    id,
    kind,
    name,
    airportId,
    ...extra,
    equipmentCount: equipmentIds.size,
    faultCount7d: faultCountForEquipment(raw.faults, equipmentIds, daysAgoIso(7)),
    faultCountPrev7d: faultCountForEquipment(raw.faults, equipmentIds, daysAgoIso(14), daysAgoIso(7)),
    faultCount30d: faultCountForEquipment(raw.faults, equipmentIds, daysAgoIso(30)),
    criticalOpenCount: raw.faults.filter(
      (f) => equipmentIds.has(f.equipmentId) && f.priority === "critical" && f.stage !== "closed"
    ).length,
    healthScore: healthScoreFor(raw.faults, raw.inspections, raw.equipment, equipmentIds),
    dominantCategory: dominantCategoryFor(raw.faults, equipmentIds, daysAgoIso(7)),
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

function airportNameOf(airports: Airport[], airportId: number): string {
  return airports.find((a) => a.id === airportId)?.name ?? "—";
}

/**
 * Rolls fault/inspection data up to airport/terminal/zone level and derives
 * human-readable insight callouts from real week-over-week deltas — no
 * hardcoded narrative, everything is computed from live backend data.
 */
export async function getHealthSummary(scope?: { airportId?: number }): Promise<HealthSummary> {
  const raw = await fetchAll();
  const scopedAirports = scope?.airportId ? raw.airports.filter((a) => a.id === scope.airportId) : raw.airports;
  const scopedTerminals = raw.terminals.filter((t) => scopedAirports.some((a) => a.id === t.airportId));
  const scopedZones = raw.zones.filter((z) => scopedTerminals.some((t) => t.id === z.terminalId));

  const airportEntities = scopedAirports.map((a) =>
    buildEntity(raw, "airport", `airport-${a.id}`, a.name, a.id, new Set(raw.equipment.filter((e) => e.airport.id === a.id).map((e) => e.id)))
  );
  const terminalEntities = scopedTerminals.map((t) =>
    buildEntity(
      raw,
      "terminal",
      `terminal-${t.id}`,
      t.name,
      t.airportId,
      new Set(raw.equipment.filter((e) => e.terminal?.id === t.id).map((e) => e.id)),
      { terminalId: t.id }
    )
  );
  const zoneEntities = scopedZones.map((z) => {
    const terminal = raw.terminals.find((t) => t.id === z.terminalId)!;
    return buildEntity(
      raw,
      "zone",
      `zone-${z.id}`,
      z.name,
      terminal.airportId,
      new Set(raw.equipment.filter((e) => e.zone?.id === z.id).map((e) => e.id)),
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
    const deltaPct =
      zone.faultCountPrev7d > 0 ? Math.round(((zone.faultCount7d - zone.faultCountPrev7d) / zone.faultCountPrev7d) * 100) : null;
    const deltaText = deltaPct != null ? `на ${deltaPct}%` : `с ${zone.faultCountPrev7d} до ${zone.faultCount7d}`;
    const zoneLabel = `${zone.name} (${airportNameOf(raw.airports, zone.airportId)})`;
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
    const entityLabel = `${entity.name} (${airportNameOf(raw.airports, entity.airportId)})`;
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

  const today = new Date().toISOString().slice(0, 10);
  const maintenanceRiskCount = raw.equipment.filter((e) => {
    const overdue = e.nextInspectionAt != null && e.nextInspectionAt < today;
    const openFaults30d = raw.faults.filter(
      (f) => f.equipmentId === e.id && f.stage !== "closed" && f.detectedAt >= daysAgoIso(30)
    ).length;
    return overdue || openFaults30d >= 2;
  }).length;

  return { entities, insights: insights.slice(0, 8), maintenanceRiskCount };
}

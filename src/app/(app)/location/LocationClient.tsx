"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { TerminalMap, loadMarkerOverrides, type ZoneHealthTone } from "./TerminalMap";
import { HealthInsightCallout } from "@/components/dashboard/HealthInsightCallout";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { useHealthSummary } from "@/hooks/useHealthSummary";
import { useTranslations } from "@/lib/locale-context";
import { cn } from "@/lib/cn";
import type { Airport, Equipment, EquipmentStatus, Terminal, Zone } from "@/lib/types";

interface Props {
  airports: Airport[];
  terminals: Terminal[];
  zones: Zone[];
  equipment: Equipment[];
}

const STATUS_ORDER: EquipmentStatus[] = [
  "operational",
  "maintenance",
  "faulty",
  "requires_inspection",
  "reserve",
  "decommissioned",
];

function countByStatus(items: Equipment[]) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<EquipmentStatus, number>;
  for (const eq of items) counts[eq.status] += 1;
  return counts;
}

export function LocationClient({ airports, terminals, zones, equipment }: Props) {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [airportId, setAirportId] = useState(airports[0]?.id ?? "");
  const airportTerminals = useMemo(
    () => terminals.filter((t) => t.airportId === airportId),
    [terminals, airportId]
  );

  const [terminalId, setTerminalId] = useState(airportTerminals[0]?.id ?? "");
  const terminalZones = useMemo(
    () => zones.filter((z) => z.terminalId === terminalId),
    [zones, terminalId]
  );

  const [zoneId, setZoneId] = useState<string | null>(terminalZones[0]?.id ?? null);

  // Equipment can be dragged to a different room/zone on the terminal map
  // (see TerminalMap's zone auto-detection); this local override keeps the
  // navigation counts, Zone Panel, and equipment table in sync with that
  // reassignment without mutating the shared mock-data module. Seeded from
  // the same localStorage record TerminalMap persists positions to, via a
  // layout effect (SSR has no localStorage — hydration-safe, same pattern
  // as locale-context.tsx).
  const [zoneOverrides, setZoneOverrides] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    const stored = loadMarkerOverrides();
    const overrides: Record<string, string> = {};
    for (const [equipmentId, rec] of Object.entries(stored)) {
      if (rec.zoneId) overrides[equipmentId] = rec.zoneId;
    }
    if (Object.keys(overrides).length > 0) setZoneOverrides(overrides);
  }, []);

  // Pre-select from a `/location/health` "view" link (?airportId=&terminalId=&zoneId=).
  // Additive only — default (no params) behavior is unchanged.
  const searchParams = useSearchParams();
  useEffect(() => {
    const qAirport = searchParams.get("airportId");
    const qTerminal = searchParams.get("terminalId");
    const qZone = searchParams.get("zoneId");
    if (!qAirport) return;
    setAirportId(qAirport);
    if (qTerminal) setTerminalId(qTerminal);
    if (qZone) setZoneId(qZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedEquipment = useMemo(
    () =>
      equipment.map((e) => (zoneOverrides[e.id] ? { ...e, zoneId: zoneOverrides[e.id] } : e)),
    [equipment, zoneOverrides]
  );

  function selectAirport(id: string) {
    setAirportId(id);
    const firstTerminal = terminals.find((t) => t.airportId === id) ?? null;
    setTerminalId(firstTerminal?.id ?? "");
    const firstZone = firstTerminal ? zones.find((z) => z.terminalId === firstTerminal.id) : null;
    setZoneId(firstZone?.id ?? null);
  }

  function selectTerminal(id: string) {
    setTerminalId(id);
    const firstZone = zones.find((z) => z.terminalId === id) ?? null;
    setZoneId(firstZone?.id ?? null);
  }

  const terminalEquipment = useMemo(
    () => resolvedEquipment.filter((e) => e.terminalId === terminalId),
    [resolvedEquipment, terminalId]
  );
  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const zoneEquipment = useMemo(
    () => (zoneId ? resolvedEquipment.filter((e) => e.zoneId === zoneId) : []),
    [resolvedEquipment, zoneId]
  );

  function handleEquipmentZoneChange(equipmentId: string, newZoneId: string) {
    setZoneOverrides((prev) => ({ ...prev, [equipmentId]: newZoneId }));
  }

  const tableItems = zoneId ? zoneEquipment : terminalEquipment;
  const selectedAirport = airports.find((a) => a.id === airportId) ?? null;
  const selectedTerminal = terminals.find((t) => t.id === terminalId) ?? null;

  const { data: health } = useHealthSummary({ airportId });
  const zoneHealth = useMemo(() => {
    const map: Record<string, ZoneHealthTone> = {};
    for (const e of health?.entities ?? []) {
      if (e.kind !== "zone" || e.terminalId !== terminalId) continue;
      if (e.healthScore < 50) map[e.id] = "error";
      else if (e.healthScore < 75) map[e.id] = "warning";
    }
    return map;
  }, [health, terminalId]);
  const terminalInsights = (health?.insights ?? []).filter((i) => i.entity.terminalId === terminalId);
  const visibleInsights = (terminalInsights.length > 0 ? terminalInsights : health?.insights ?? []).slice(0, 2);
  const maintenanceRiskCount = health?.maintenanceRiskCount ?? 0;

  return (
    <div className="pb-8">
      <PageHeader
        title={t("location.title")}
        context={t("location.context")}
        actions={
          <>
            <div className="flex items-center rounded-md border border-border-primary bg-bg-primary p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "list" ? "bg-brand-600 text-white" : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {t("common.list")}
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "map" ? "bg-brand-600 text-white" : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {t("common.map")}
              </button>
            </div>
            <Button hierarchy="secondary" icon="download" size="sm">
              {t("common.export")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[260px_1fr_300px]">
        {/* NAVIGATE */}
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border-secondary px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{t("location.navigation")}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {airports.map((airport) => {
              const isActiveAirport = airport.id === airportId;
              const count = equipment.filter((e) => e.airportId === airport.id).length;
              return (
                <div key={airport.id} className="mb-1">
                  <button
                    onClick={() => selectAirport(airport.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isActiveAirport
                        ? "bg-(--chip-brand-bg) text-(--chip-brand-text)"
                        : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                  >
                    <Icon name="building" size={16} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate font-medium">{airport.name}</span>
                    <span className="shrink-0 text-xs text-text-quaternary">{count}</span>
                  </button>

                  {isActiveAirport && (
                    <div className="ml-3 mt-0.5 border-l border-border-secondary pl-3">
                      {terminals
                        .filter((t) => t.airportId === airport.id)
                        .map((terminal) => {
                          const isActiveTerminal = terminal.id === terminalId;
                          return (
                            <div key={terminal.id}>
                              <button
                                onClick={() => selectTerminal(terminal.id)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                  isActiveTerminal
                                    ? "text-brand-300"
                                    : "text-text-tertiary hover:text-text-primary"
                                )}
                              >
                                <Icon name="layers" size={13} className="shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{terminal.name}</span>
                              </button>

                              {isActiveTerminal && (
                                <div className="ml-3 border-l border-border-secondary pl-3">
                                  {zones
                                    .filter((z) => z.terminalId === terminal.id)
                                    .map((zone) => {
                                      const isActiveZone = zone.id === zoneId;
                                      return (
                                        <button
                                          key={zone.id}
                                          onClick={() => setZoneId(zone.id)}
                                          className={cn(
                                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                            isActiveZone
                                              ? "bg-bg-tertiary text-text-primary"
                                              : "text-text-quaternary hover:text-text-primary"
                                          )}
                                        >
                                          <Icon name="map-pin" size={12} className="shrink-0" />
                                          <span className="min-w-0 flex-1 truncate">{zone.name}</span>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="shrink-0 border-t border-border-secondary p-3">
            <p className="mb-2 text-xs font-medium text-text-quaternary">{t("location.equipmentStatusTerminal")}</p>
            <StatusSummary counts={countByStatus(terminalEquipment)} statusConfig={equipmentStatusConfig} />
            <div className="mt-2">
              <StatTile label={t("location.maintenanceRisk")} value={maintenanceRiskCount} dotClassName="bg-warning-500" />
            </div>
          </div>
        </Card>

        {/* VISUALIZE */}
        <Card className="flex h-fit flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-secondary px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {selectedAirport?.name ?? "—"}
                {selectedTerminal ? ` · ${selectedTerminal.name}` : ""}
              </p>
              <p className="text-xs text-text-tertiary">{t("location.schematicPlan")}</p>
            </div>
          </div>

          {terminalZones.length === 0 ? (
            <p className="py-16 text-center text-sm text-text-tertiary">{t("location.noZones")}</p>
          ) : viewMode === "map" ? (
            <TerminalMap
              zones={terminalZones}
              equipment={terminalEquipment}
              selectedZoneId={zoneId}
              onSelectZone={setZoneId}
              onEquipmentZoneChange={handleEquipmentZoneChange}
              statusConfig={equipmentStatusConfig}
              zoneHealth={zoneHealth}
            />
          ) : (
            <EquipmentTable items={terminalEquipment} />
          )}
        </Card>

        {/* INSPECT */}
        <ZonePanel
          zone={selectedZone}
          airportName={selectedAirport?.name ?? "—"}
          terminalName={selectedTerminal?.name ?? "—"}
          items={zoneEquipment}
          t={t}
          statusConfig={equipmentStatusConfig}
        />
      </div>

      {visibleInsights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 px-6 pt-4 lg:grid-cols-2">
          {visibleInsights.map((insight) => (
            <HealthInsightCallout
              key={insight.id}
              insight={insight}
              ctaLabel={t("location.viewDetails")}
              onNavigate={() => {
                if (insight.entity.airportId) setAirportId(insight.entity.airportId);
                if (insight.entity.terminalId) setTerminalId(insight.entity.terminalId);
                if (insight.entity.zoneId) setZoneId(insight.entity.zoneId);
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-4 px-6">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              {t("location.equipmentPrefix")}{" "}
              {zoneId ? `— ${selectedZone?.name}` : `— ${selectedTerminal?.name ?? t("location.terminalFallback")}`}
            </p>
            <span className="text-xs text-text-quaternary">
              {tableItems.length} {t("location.records")}
            </span>
          </div>
          {tableItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-text-tertiary">
              <Icon name="cpu" size={22} />
              <p className="text-sm">{t("location.noEquipmentFound")}</p>
            </div>
          ) : (
            <EquipmentTable items={tableItems} />
          )}
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  dotClassName,
}: {
  label: string;
  value: number;
  tone?: "neutral";
  dotClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border-primary bg-bg-primary p-2.5">
      <div className="flex items-center gap-1.5">
        {tone !== "neutral" && dotClassName && <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} />}
        <p className="truncate text-xs text-text-tertiary">{label}</p>
      </div>
      <p className="mt-1 text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function StatusSummary({
  counts,
  statusConfig,
}: {
  counts: Record<EquipmentStatus, number>;
  statusConfig: Record<EquipmentStatus, ReturnType<typeof getEquipmentStatusConfig>[EquipmentStatus]>;
}) {
  return (
    <div className="space-y-1.5">
      {STATUS_ORDER.map((status) => {
        const cfg = statusConfig[status];
        const value = counts[status];
        if (value === 0) return null;
        return (
          <div key={status} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            <span className="font-medium text-text-primary">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function ZonePanel({
  zone,
  airportName,
  terminalName,
  items,
  t,
  statusConfig,
}: {
  zone: Zone | null;
  airportName: string;
  terminalName: string;
  items: Equipment[];
  t: (key: import("@/lib/i18n/translations").TranslationKey) => string;
  statusConfig: ReturnType<typeof getEquipmentStatusConfig>;
}) {
  if (!zone) {
    return (
      <Card className="flex h-full items-center justify-center p-10 text-center text-sm text-text-tertiary">
        {t("location.selectZoneHint")}
      </Card>
    );
  }

  const counts = countByStatus(items);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border-secondary px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">{zone.name}</p>
        <p className="text-xs text-text-tertiary">
          {airportName} · {terminalName}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="mb-2 text-xs font-medium text-text-quaternary">{t("location.statusSummary")}</p>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label={t("common.total")} value={items.length} tone="neutral" />
            {STATUS_ORDER.filter((s) => s !== "decommissioned").map((status) => (
              <StatTile
                key={status}
                label={statusConfig[status].label}
                value={counts[status]}
                dotClassName={statusConfig[status].dot}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-text-quaternary">{t("location.equipmentList")}</p>
          <div className="space-y-1.5">
            {items.length === 0 && (
              <p className="text-xs text-text-quaternary">{t("location.noEquipmentInZone")}</p>
            )}
            {items.map((eq) => (
              <Link
                key={eq.id}
                href={`/equipment/${eq.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-bg-tertiary"
              >
                <span className="min-w-0 truncate text-text-secondary">{eq.name}</span>
                <StatusBadge status={statusConfig[eq.status]} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

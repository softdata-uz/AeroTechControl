"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { TerminalMap, type ZoneHealthTone } from "./TerminalMap";
import { HealthInsightCallout } from "@/components/dashboard/HealthInsightCallout";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { useLocations } from "@/hooks/useLocations";
import { useEquipmentList } from "@/hooks/useEquipmentList";
import { useHealthSummary } from "@/hooks/useHealthSummary";
import { useTranslations } from "@/lib/locale-context";
import { exportEquipment } from "@/services/equipment.service";
import { cn } from "@/lib/cn";
import type { Equipment, EquipmentStatus, Zone } from "@/lib/types";

const STATUS_ORDER: EquipmentStatus[] = [
  "faulty",
  "operational",
  "good",
  "satisfactory",
  "unsatisfactory",
  "overdue",
  "not_connected",
];

function countByStatus(items: Equipment[]) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<EquipmentStatus, number>;
  for (const eq of items) counts[eq.status] += 1;
  return counts;
}

export function LocationClient() {
  const t = useTranslations();
  const { airports, terminals, floors, zones } = useLocations();
  const { data: equipmentPage, refetch: refetchEquipment } = useEquipmentList({ pageSize: 200 });
  const equipment = useMemo(() => equipmentPage?.items ?? [], [equipmentPage]);
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [airportId, setAirportId] = useState<number | "">("");
  const [terminalId, setTerminalId] = useState<number | "">("");
  const [floorId, setFloorId] = useState<number | "">("");
  const floorZones = useMemo(() => zones.filter((z) => z.floorId === floorId), [zones, floorId]);

  const [zoneId, setZoneId] = useState<number | null>(null);

  // Seed the initial airport/terminal/floor/zone selection once the
  // directory data has loaded (it's empty on first render since
  // useLocations fetches asynchronously — unlike the old mock arrays,
  // which were available synchronously at import time). A
  // `/location/health` "view" link (?airportId=&terminalId=&zoneId=)
  // pre-selects instead of defaulting to the first airport — additive
  // only, default (no params) behavior is unchanged. The floor is derived
  // from the linked zone/terminal since the link doesn't encode floorId.
  const searchParams = useSearchParams();
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || airports.length === 0) return;
    seeded.current = true;

    const qAirport = Number(searchParams.get("airportId"));
    const qTerminal = Number(searchParams.get("terminalId"));
    const qZone = Number(searchParams.get("zoneId"));
    const linkedAirport = qAirport ? airports.find((a) => a.id === qAirport) : undefined;

    const firstAirport = linkedAirport ?? airports[0];
    setAirportId(firstAirport.id);
    const firstTerminal =
      (qTerminal ? terminals.find((tm) => tm.id === qTerminal && tm.airportId === firstAirport.id) : undefined) ??
      terminals.find((tm) => tm.airportId === firstAirport.id) ??
      null;
    setTerminalId(firstTerminal?.id ?? "");
    const linkedZone = qZone ? zones.find((z) => z.id === qZone) : undefined;
    const firstFloor =
      (linkedZone ? floors.find((f) => f.id === linkedZone.floorId) : undefined) ??
      (firstTerminal ? floors.find((f) => f.terminalId === firstTerminal.id) : null) ??
      null;
    setFloorId(firstFloor?.id ?? "");
    const firstZone =
      linkedZone ?? (firstFloor ? zones.find((z) => z.floorId === firstFloor.id) : null) ?? null;
    setZoneId(firstZone?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airports, terminals, floors, zones]);

  function selectAirport(id: number) {
    setAirportId(id);
    const firstTerminal = terminals.find((tm) => tm.airportId === id) ?? null;
    setTerminalId(firstTerminal?.id ?? "");
    const firstFloor = firstTerminal ? floors.find((f) => f.terminalId === firstTerminal.id) : null;
    setFloorId(firstFloor?.id ?? "");
    const firstZone = firstFloor ? zones.find((z) => z.floorId === firstFloor.id) : null;
    setZoneId(firstZone?.id ?? null);
  }

  function selectTerminal(id: number) {
    setTerminalId(id);
    const firstFloor = floors.find((f) => f.terminalId === id) ?? null;
    setFloorId(firstFloor?.id ?? "");
    const firstZone = firstFloor ? zones.find((z) => z.floorId === firstFloor.id) : null;
    setZoneId(firstZone?.id ?? null);
  }

  function selectFloor(id: number) {
    setFloorId(id);
    const firstZone = zones.find((z) => z.floorId === id) ?? null;
    setZoneId(firstZone?.id ?? null);
  }

  const terminalEquipment = useMemo(
    () => equipment.filter((e) => e.terminal?.id === terminalId),
    [equipment, terminalId]
  );
  const floorEquipment = useMemo(
    () => equipment.filter((e) => e.floor?.id === floorId),
    [equipment, floorId]
  );
  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const zoneEquipment = useMemo(
    () => (zoneId ? equipment.filter((e) => e.zone?.id === zoneId) : []),
    [equipment, zoneId]
  );

  const selectedAirport = airports.find((a) => a.id === airportId) ?? null;
  const selectedTerminal = terminals.find((tm) => tm.id === terminalId) ?? null;
  const selectedFloor = floors.find((f) => f.id === floorId) ?? null;

  const { data: health } = useHealthSummary({ airportId: airportId || undefined });
  const zoneHealth = useMemo(() => {
    const map: Record<number, ZoneHealthTone> = {};
    for (const e of health?.entities ?? []) {
      if (e.kind !== "zone" || e.terminalId !== terminalId) continue;
      if (e.healthScore < 50) map[e.zoneId!] = "error";
      else if (e.healthScore < 75) map[e.zoneId!] = "warning";
    }
    return map;
  }, [health, terminalId]);
  const terminalInsights = (health?.insights ?? []).filter((i) => i.entity.terminalId === terminalId);
  const visibleInsights = (terminalInsights.length > 0 ? terminalInsights : health?.insights ?? []).slice(0, 2);
  const maintenanceRiskCount = health?.maintenanceRiskCount ?? 0;

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      await exportEquipment({
        airportId: airportId || undefined,
        terminalId: terminalId || undefined,
        floorId: floorId || undefined,
        zoneId: zoneId || undefined,
      });
    } finally {
      setExporting(false);
    }
  }

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
            <Button hierarchy="secondary" icon="download" size="sm" disabled={exporting} onClick={handleExport}>
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
              const count = equipment.filter((e) => e.airport.id === airport.id).length;
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
                        .filter((tm) => tm.airportId === airport.id)
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
                                  {floors
                                    .filter((f) => f.terminalId === terminal.id)
                                    .map((floor) => {
                                      const isActiveFloor = floor.id === floorId;
                                      return (
                                        <button
                                          key={floor.id}
                                          onClick={() => selectFloor(floor.id)}
                                          className={cn(
                                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                            isActiveFloor
                                              ? "bg-bg-tertiary text-text-primary"
                                              : "text-text-quaternary hover:text-text-primary"
                                          )}
                                        >
                                          <Icon name="grid" size={12} className="shrink-0" />
                                          <span className="min-w-0 flex-1 truncate">{floor.name}</span>
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
                {selectedFloor ? ` · ${selectedFloor.name}` : ""}
              </p>
              <p className="text-xs text-text-tertiary">{t("location.schematicPlan")}</p>
            </div>
          </div>

          {!selectedFloor ? (
            <p className="py-16 text-center text-sm text-text-tertiary">{t("location.noFloors")}</p>
          ) : viewMode === "map" ? (
            <TerminalMap
              zones={floorZones}
              equipment={floorEquipment}
              selectedZoneId={zoneId}
              onSelectZone={setZoneId}
              mapImageUrl={selectedFloor.mapImageUrl}
              onPositionSaved={refetchEquipment}
              statusConfig={equipmentStatusConfig}
              zoneHealth={zoneHealth}
            />
          ) : (
            <EquipmentTable items={floorEquipment} />
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
                setAirportId(insight.entity.airportId);
                if (insight.entity.terminalId) setTerminalId(insight.entity.terminalId);
                if (insight.entity.zoneId) {
                  const linkedZone = zones.find((z) => z.id === insight.entity.zoneId);
                  if (linkedZone) setFloorId(linkedZone.floorId);
                  setZoneId(insight.entity.zoneId);
                }
              }}
            />
          ))}
        </div>
      )}
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
            {STATUS_ORDER.filter((s) => s !== "not_connected").map((status) => (
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

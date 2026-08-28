"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { EquipmentTable } from "@/components/data-display/EquipmentTable";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
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

const MARKER_SIZE = { compact: "h-2.5 w-2.5", normal: "h-3.5 w-3.5", large: "h-5 w-5" } as const;
type ZoomLevel = keyof typeof MARKER_SIZE;

function countByStatus(items: Equipment[]) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<EquipmentStatus, number>;
  for (const eq of items) counts[eq.status] += 1;
  return counts;
}

export function LocationClient({ airports, terminals, zones, equipment }: Props) {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
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
  const [zoom, setZoom] = useState<ZoomLevel>("normal");

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

  const zoomLevels: ZoomLevel[] = ["compact", "normal", "large"];
  const zoomIndex = zoomLevels.indexOf(zoom);

  const terminalEquipment = useMemo(
    () => equipment.filter((e) => e.terminalId === terminalId),
    [equipment, terminalId]
  );
  const selectedZone = zones.find((z) => z.id === zoneId) ?? null;
  const zoneEquipment = useMemo(
    () => (zoneId ? equipment.filter((e) => e.zoneId === zoneId) : []),
    [equipment, zoneId]
  );

  const tableItems = zoneId ? zoneEquipment : terminalEquipment;
  const selectedAirport = airports.find((a) => a.id === airportId) ?? null;
  const selectedTerminal = terminals.find((t) => t.id === terminalId) ?? null;

  return (
    <div className="pb-8">
      <PageHeader
        title={t("location.title")}
        context={t("location.context")}
        actions={
          <Button hierarchy="secondary" icon="download" size="sm">
            {t("common.export")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[260px_1fr_300px]">
        {/* NAVIGATE */}
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-border-secondary px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{t("location.navigation")}</p>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-2">
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

          <div className="border-t border-border-secondary p-3">
            <p className="mb-2 text-xs font-medium text-text-quaternary">{t("location.equipmentStatusTerminal")}</p>
            <StatusSummary counts={countByStatus(terminalEquipment)} statusConfig={equipmentStatusConfig} />
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
            <div className="flex items-center gap-1">
              <button
                aria-label={t("location.zoomOut")}
                disabled={zoomIndex === 0}
                onClick={() => setZoom(zoomLevels[Math.max(0, zoomIndex - 1)])}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-tertiary hover:bg-bg-tertiary disabled:opacity-30"
              >
                −
              </button>
              <span className="w-10 text-center text-xs text-text-quaternary">
                {zoomIndex === 0 ? "S" : zoomIndex === 1 ? "M" : "L"}
              </span>
              <button
                aria-label={t("location.zoomIn")}
                disabled={zoomIndex === zoomLevels.length - 1}
                onClick={() => setZoom(zoomLevels[Math.min(zoomLevels.length - 1, zoomIndex + 1)])}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-tertiary hover:bg-bg-tertiary disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {terminalZones.length === 0 && (
              <p className="py-10 text-center text-sm text-text-tertiary sm:col-span-2">
                {t("location.noZones")}
              </p>
            )}
            {terminalZones.map((zone) => {
              const items = equipment.filter((e) => e.zoneId === zone.id);
              const isActive = zone.id === zoneId;
              return (
                <button
                  key={zone.id}
                  onClick={() => setZoneId(zone.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    isActive
                      ? "border-brand-600 bg-(--chip-brand-bg)"
                      : "border-border-primary bg-bg-primary hover:border-border-secondary"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-text-primary">{zone.name}</p>
                    <span className="shrink-0 text-xs text-text-quaternary">
                      {equipment.filter((e) => e.zoneId === zone.id).length} {t("location.unitsSuffix")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.length === 0 && (
                      <span className="text-xs text-text-quaternary">{t("location.hiddenOrEmpty")}</span>
                    )}
                    {items.map((eq) => (
                      <span
                        key={eq.id}
                        title={`${eq.name} · ${equipmentStatusConfig[eq.status].label}`}
                        className={cn(
                          "rounded-sm",
                          MARKER_SIZE[zoom],
                          equipmentStatusConfig[eq.status].dot
                        )}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
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
      <Card className="flex h-fit items-center justify-center p-10 text-center text-sm text-text-tertiary">
        {t("location.selectZoneHint")}
      </Card>
    );
  }

  const counts = countByStatus(items);

  return (
    <Card className="h-fit overflow-hidden">
      <div className="border-b border-border-secondary px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">{zone.name}</p>
        <p className="text-xs text-text-tertiary">
          {airportName} · {terminalName}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-primary p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary">
            <Icon name="cpu" size={18} className="text-text-tertiary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{items.length}</p>
            <p className="text-xs text-text-tertiary">{t("location.unitsInZone")}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-text-quaternary">{t("location.statusSummary")}</p>
          <StatusSummary counts={counts} statusConfig={statusConfig} />
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

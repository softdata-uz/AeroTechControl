"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { airportsService } from "@/services";
import { usePermissions } from "@/hooks/usePermissions";
import type { Airport, Terminal, Floor, Zone } from "@/lib/types";

// Airports/terminals/floors/zones are a small, bounded directory (a handful
// of airports, a few dozen terminals/floors/zones) — fetched once and
// cached here so every page that previously did a synchronous
// `airportName(id)` lookup against mock-data can keep that same ergonomic,
// just backed by real data loaded up front instead of a static import.
//
// For airport-scoped roles (see usePermissions()), the returned arrays are
// narrowed down to just the user's own airport and its terminals/floors/
// zones — every consumer (Location page, filter dropdowns, EquipmentForm's
// cascading selects, the Dashboard map) automatically only ever sees that
// one airport's data with no per-page filtering needed.
export function useLocations() {
  const { isAirportScoped, scopedAirportId } = usePermissions();
  const [allAirports, setAirports] = useState<Airport[]>([]);
  const [allTerminals, setTerminals] = useState<Terminal[]>([]);
  const [allFloors, setFloors] = useState<Floor[]>([]);
  const [allZones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const airports = useMemo(
    () => (isAirportScoped ? allAirports.filter((a) => a.id === scopedAirportId) : allAirports),
    [allAirports, isAirportScoped, scopedAirportId]
  );
  const terminals = useMemo(
    () => (isAirportScoped ? allTerminals.filter((tm) => tm.airportId === scopedAirportId) : allTerminals),
    [allTerminals, isAirportScoped, scopedAirportId]
  );
  const scopedTerminalIds = useMemo(() => new Set(terminals.map((tm) => tm.id)), [terminals]);
  const floors = useMemo(
    () => (isAirportScoped ? allFloors.filter((f) => scopedTerminalIds.has(f.terminalId)) : allFloors),
    [allFloors, isAirportScoped, scopedTerminalIds]
  );
  const scopedFloorIds = useMemo(() => new Set(floors.map((f) => f.id)), [floors]);
  const zones = useMemo(
    () => (isAirportScoped ? allZones.filter((z) => scopedFloorIds.has(z.floorId)) : allZones),
    [allZones, isAirportScoped, scopedFloorIds]
  );

  const load = useCallback(() => {
    return Promise.all([
      airportsService.listAirports(),
      airportsService.listAllTerminals(),
      airportsService.listAllFloors(),
      airportsService.listAllZones(),
    ]).then(([a, t, f, z]) => {
      setAirports(a);
      setTerminals(t);
      setFloors(f);
      setZones(z);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const airportName = useCallback(
    (airportId: number | null | undefined) =>
      airports.find((a) => a.id === airportId)?.name ?? "—",
    [airports]
  );

  const terminalsByAirport = useCallback(
    (airportId: number) => terminals.filter((t) => t.airportId === airportId),
    [terminals]
  );

  const floorsByTerminal = useCallback(
    (terminalId: number) => floors.filter((f) => f.terminalId === terminalId),
    [floors]
  );

  const zonesByFloor = useCallback(
    (floorId: number) => zones.filter((z) => z.floorId === floorId),
    [zones]
  );

  const addTerminal = useCallback((terminal: Terminal) => {
    setTerminals((prev) => [...prev, terminal]);
  }, []);

  const addFloor = useCallback((floor: Floor) => {
    setFloors((prev) => [...prev, floor]);
  }, []);

  const addZone = useCallback((zone: Zone) => {
    setZones((prev) => [...prev, zone]);
  }, []);

  return useMemo(
    () => ({
      airports,
      terminals,
      floors,
      zones,
      loading,
      airportName,
      terminalsByAirport,
      floorsByTerminal,
      zonesByFloor,
      addTerminal,
      addFloor,
      addZone,
      refetch: load,
    }),
    [
      airports,
      terminals,
      floors,
      zones,
      loading,
      airportName,
      terminalsByAirport,
      floorsByTerminal,
      zonesByFloor,
      addTerminal,
      addFloor,
      addZone,
      load,
    ]
  );
}

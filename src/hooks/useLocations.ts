"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { airportsService } from "@/services";
import type { Airport, Terminal, Floor, Zone } from "@/lib/types";

// Airports/terminals/floors/zones are a small, bounded directory (a handful
// of airports, a few dozen terminals/floors/zones) — fetched once and
// cached here so every page that previously did a synchronous
// `airportName(id)` lookup against mock-data can keep that same ergonomic,
// just backed by real data loaded up front instead of a static import.
export function useLocations() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

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

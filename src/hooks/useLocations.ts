"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { airportsService } from "@/services";
import type { Airport, Terminal, Zone } from "@/lib/types";

// Airports/terminals/zones are a small, bounded directory (a handful of
// airports, a few dozen terminals/zones) — fetched once and cached here so
// every page that previously did a synchronous `airportName(id)` lookup
// against mock-data can keep that same ergonomic, just backed by real data
// loaded up front instead of a static import.
export function useLocations() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return Promise.all([
      airportsService.listAirports(),
      airportsService.listAllTerminals(),
      airportsService.listAllZones(),
    ]).then(([a, t, z]) => {
      setAirports(a);
      setTerminals(t);
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

  const zonesByTerminal = useCallback(
    (terminalId: number) => zones.filter((z) => z.terminalId === terminalId),
    [zones]
  );

  const addTerminal = useCallback((terminal: Terminal) => {
    setTerminals((prev) => [...prev, terminal]);
  }, []);

  const addZone = useCallback((zone: Zone) => {
    setZones((prev) => [...prev, zone]);
  }, []);

  return useMemo(
    () => ({
      airports,
      terminals,
      zones,
      loading,
      airportName,
      terminalsByAirport,
      zonesByTerminal,
      addTerminal,
      addZone,
      refetch: load,
    }),
    [
      airports,
      terminals,
      zones,
      loading,
      airportName,
      terminalsByAirport,
      zonesByTerminal,
      addTerminal,
      addZone,
      load,
    ]
  );
}

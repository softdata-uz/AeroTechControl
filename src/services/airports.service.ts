import type { Airport, Terminal, Zone } from "@/lib/types";
import { airports, terminals, zones, terminalsByAirport, zonesByTerminal } from "@/lib/mock-data";
import { resolve } from "./http-client";

// GET /airports
export function listAirports(): Promise<Airport[]> {
  return resolve(() => airports);
}

// GET /airports/:id/terminals
export function listTerminals(airportId: string): Promise<Terminal[]> {
  return resolve(() => terminalsByAirport(airportId));
}

// GET /terminals/:id/zones
export function listZones(terminalId: string): Promise<Zone[]> {
  return resolve(() => zonesByTerminal(terminalId));
}

// GET /zones (unfiltered — used to hydrate lookups)
export function listAllZones(): Promise<Zone[]> {
  return resolve(() => zones);
}

// GET /terminals (unfiltered — used to hydrate lookups)
export function listAllTerminals(): Promise<Terminal[]> {
  return resolve(() => terminals);
}

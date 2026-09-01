import type { Airport, Terminal, Zone } from "@/lib/types";
import { apiGet, apiPost, apiPatch, apiDelete } from "./http-client";

// GET /airports
export function listAirports(): Promise<Airport[]> {
  return apiGet<Airport[]>("/airports");
}

// GET /airports/:id/terminals
export function listTerminals(airportId: number): Promise<Terminal[]> {
  return apiGet<Terminal[]>(`/airports/${airportId}/terminals`);
}

// GET /terminals/:id/zones
export function listZones(terminalId: number): Promise<Zone[]> {
  return apiGet<Zone[]>(`/terminals/${terminalId}/zones`);
}

// GET /zones (unfiltered — used to hydrate lookups)
export function listAllZones(): Promise<Zone[]> {
  return apiGet<Zone[]>("/zones");
}

// GET /terminals (unfiltered — used to hydrate lookups)
export function listAllTerminals(): Promise<Terminal[]> {
  return apiGet<Terminal[]>("/terminals");
}

export interface AirportInput {
  name: string;
  code: string;
  city: string;
}

// POST /airports (administrator only)
export function createAirport(input: AirportInput): Promise<Airport> {
  return apiPost<Airport>("/airports", input);
}

// PATCH /airports/:id (administrator only)
export function updateAirport(id: number, input: Partial<AirportInput>): Promise<Airport> {
  return apiPatch<Airport>(`/airports/${id}`, input);
}

// DELETE /airports/:id (administrator only)
export function deleteAirport(id: number): Promise<void> {
  return apiDelete<void>(`/airports/${id}`);
}

export interface TerminalInput {
  airportId: number;
  name: string;
}

// POST /terminals (administrator only)
export function createTerminal(input: TerminalInput): Promise<Terminal> {
  return apiPost<Terminal>("/terminals", input);
}

// PATCH /terminals/:id (administrator only)
export function updateTerminal(id: number, input: Partial<TerminalInput>): Promise<Terminal> {
  return apiPatch<Terminal>(`/terminals/${id}`, input);
}

// DELETE /terminals/:id (administrator only)
export function deleteTerminal(id: number): Promise<void> {
  return apiDelete<void>(`/terminals/${id}`);
}

export interface ZoneInput {
  terminalId: number;
  name: string;
}

// POST /zones (administrator only)
export function createZone(input: ZoneInput): Promise<Zone> {
  return apiPost<Zone>("/zones", input);
}

// PATCH /zones/:id (administrator only)
export function updateZone(id: number, input: Partial<ZoneInput>): Promise<Zone> {
  return apiPatch<Zone>(`/zones/${id}`, input);
}

// DELETE /zones/:id (administrator only)
export function deleteZone(id: number): Promise<void> {
  return apiDelete<void>(`/zones/${id}`);
}

import type { Airport, Terminal, Floor, Zone } from "@/lib/types";
import type { UzbekistanRegion } from "@/config/regions.config";
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "./http-client";

// GET /airports
export function listAirports(): Promise<Airport[]> {
  return apiGet<Airport[]>("/airports");
}

// GET /airports/:id/terminals
export function listTerminals(airportId: number): Promise<Terminal[]> {
  return apiGet<Terminal[]>(`/airports/${airportId}/terminals`);
}

// GET /terminals/:id/floors
export function listFloors(terminalId: number): Promise<Floor[]> {
  return apiGet<Floor[]>(`/terminals/${terminalId}/floors`);
}

// GET /floors (unfiltered — used to hydrate lookups)
export function listAllFloors(): Promise<Floor[]> {
  return apiGet<Floor[]>("/floors");
}

// GET /floors/:id/zones
export function listZones(floorId: number): Promise<Zone[]> {
  return apiGet<Zone[]>(`/floors/${floorId}/zones`);
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
  region: UzbekistanRegion;
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

export interface FloorInput {
  terminalId: number;
  name: string;
  /** undefined = leave unchanged (edit only), File = replace/set */
  mapImage?: File;
}

function buildFloorFormData(input: Partial<FloorInput>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (key === "mapImage") continue;
    if (value === undefined || value === null || value === "") continue;
    formData.set(key, String(value));
  }
  if (input.mapImage instanceof File) {
    formData.set("mapImage", input.mapImage);
  }
  return formData;
}

// POST /floors (administrator only)
export function createFloor(input: FloorInput): Promise<Floor> {
  if (input.mapImage instanceof File) {
    return apiUpload<Floor>("/floors", buildFloorFormData(input));
  }
  const { mapImage: _mapImage, ...rest } = input;
  return apiPost<Floor>("/floors", rest);
}

// PATCH /floors/:id (administrator only)
export function updateFloor(id: number, input: Partial<FloorInput>): Promise<Floor> {
  if (input.mapImage instanceof File) {
    return apiUpload<Floor>(`/floors/${id}`, buildFloorFormData(input), "PATCH");
  }
  const { mapImage: _mapImage, ...rest } = input;
  return apiPatch<Floor>(`/floors/${id}`, rest);
}

// DELETE /floors/:id (administrator only)
export function deleteFloor(id: number): Promise<void> {
  return apiDelete<void>(`/floors/${id}`);
}

export interface ZoneInput {
  floorId: number;
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

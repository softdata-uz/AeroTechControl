"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CrudListPanel } from "@/components/settings/CrudListPanel";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { AirportFormModal } from "@/components/settings/AirportFormModal";
import { TerminalFormModal } from "@/components/settings/TerminalFormModal";
import { FloorFormModal } from "@/components/settings/FloorFormModal";
import { ZoneFormModal } from "@/components/settings/ZoneFormModal";
import { useLocations } from "@/hooks/useLocations";
import { airportsService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { REGION_NAME } from "@/config/regions.config";
import type { Airport, Terminal, Floor, Zone } from "@/lib/types";

export default function SettingsLocationsPage() {
  const t = useTranslations();
  const { airports, terminals, floors, zones, loading, refetch } = useLocations();

  const [airportFormOpen, setAirportFormOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const [terminalFormOpen, setTerminalFormOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [floorFormOpen, setFloorFormOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "airport" | "terminal" | "floor" | "zone";
    id: number;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function airportName(id: number) {
    return airports.find((a) => a.id === id)?.name ?? "—";
  }
  function terminalName(id: number) {
    return terminals.find((tm) => tm.id === id)?.name ?? "—";
  }
  function floorName(id: number) {
    return floors.find((f) => f.id === id)?.name ?? "—";
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === "airport") await airportsService.deleteAirport(deleteTarget.id);
      if (deleteTarget.kind === "terminal") await airportsService.deleteTerminal(deleteTarget.id);
      if (deleteTarget.kind === "floor") await airportsService.deleteFloor(deleteTarget.id);
      if (deleteTarget.kind === "zone") await airportsService.deleteZone(deleteTarget.id);
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      setDeleteError(
        err instanceof ApiException && err.status === 409
          ? t("settingsCrud.conflictError")
          : t("settingsCrud.genericError")
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("settingsCrud.locationsPageTitle")}
        context={t("settingsCrud.locationsPageContext")}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pb-6 pt-5 lg:grid-cols-2 xl:grid-cols-4">
        <CrudListPanel
          title={t("settings.airports")}
          loading={loading}
          addLabel={t("equipment.form.airport")}
          items={airports.map((a) => ({ id: a.id, primary: a.name, secondary: `${REGION_NAME[a.region]} · ${a.code}` }))}
          onAdd={() => {
            setEditingAirport(null);
            setAirportFormOpen(true);
          }}
          onEdit={(id) => {
            const airport = airports.find((a) => a.id === id);
            if (airport) {
              setEditingAirport(airport);
              setAirportFormOpen(true);
            }
          }}
          onDelete={(id) => setDeleteTarget({ kind: "airport", id: Number(id) })}
        />

        <CrudListPanel
          title={t("settings.terminals")}
          loading={loading}
          addLabel={t("equipment.form.terminal")}
          items={terminals.map((tm) => ({
            id: tm.id,
            primary: tm.name,
            secondary: airportName(tm.airportId),
          }))}
          onAdd={() => {
            setEditingTerminal(null);
            setTerminalFormOpen(true);
          }}
          onEdit={(id) => {
            const terminal = terminals.find((tm) => tm.id === id);
            if (terminal) {
              setEditingTerminal(terminal);
              setTerminalFormOpen(true);
            }
          }}
          onDelete={(id) => setDeleteTarget({ kind: "terminal", id: Number(id) })}
        />

        <CrudListPanel
          title={t("settings.floors")}
          loading={loading}
          addLabel={t("equipment.form.floor")}
          items={floors.map((f) => ({
            id: f.id,
            primary: f.name,
            secondary: terminalName(f.terminalId),
          }))}
          onAdd={() => {
            setEditingFloor(null);
            setFloorFormOpen(true);
          }}
          onEdit={(id) => {
            const floor = floors.find((f) => f.id === id);
            if (floor) {
              setEditingFloor(floor);
              setFloorFormOpen(true);
            }
          }}
          onDelete={(id) => setDeleteTarget({ kind: "floor", id: Number(id) })}
        />

        <CrudListPanel
          title={t("settings.zones")}
          loading={loading}
          addLabel={t("equipment.form.zone")}
          items={zones.map((z) => ({
            id: z.id,
            primary: z.name,
            secondary: floorName(z.floorId),
          }))}
          onAdd={() => {
            setEditingZone(null);
            setZoneFormOpen(true);
          }}
          onEdit={(id) => {
            const zone = zones.find((z) => z.id === id);
            if (zone) {
              setEditingZone(zone);
              setZoneFormOpen(true);
            }
          }}
          onDelete={(id) => setDeleteTarget({ kind: "zone", id: Number(id) })}
        />
      </div>

      {airportFormOpen && (
        <AirportFormModal
          key={editingAirport?.id ?? "new"}
          onClose={() => setAirportFormOpen(false)}
          onSaved={refetch}
          initial={editingAirport}
          create={airportsService.createAirport}
          update={airportsService.updateAirport}
        />
      )}

      {terminalFormOpen && (
        <TerminalFormModal
          key={editingTerminal?.id ?? "new"}
          onClose={() => setTerminalFormOpen(false)}
          onSaved={refetch}
          airports={airports}
          initial={editingTerminal}
          create={airportsService.createTerminal}
          update={airportsService.updateTerminal}
        />
      )}

      {floorFormOpen && (
        <FloorFormModal
          key={editingFloor?.id ?? "new"}
          onClose={() => setFloorFormOpen(false)}
          onSaved={refetch}
          terminals={terminals}
          initial={editingFloor}
          create={airportsService.createFloor}
          update={airportsService.updateFloor}
        />
      )}

      {zoneFormOpen && (
        <ZoneFormModal
          key={editingZone?.id ?? "new"}
          onClose={() => setZoneFormOpen(false)}
          onSaved={refetch}
          floors={floors}
          initial={editingZone}
          create={airportsService.createZone}
          update={airportsService.updateZone}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={t("settingsCrud.deleteConfirmTitle")}
        message={deleteError ?? t("settingsCrud.deleteConfirmMessage")}
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}

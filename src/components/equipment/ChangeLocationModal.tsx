"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLocations } from "@/hooks/useLocations";
import { equipmentService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import type { Equipment } from "@/lib/types";

interface Props {
  equipment: Equipment;
  onClose: () => void;
  onSaved: () => void;
}

/** Logged "Change Location" action — writes an EquipmentChangeLog row on the backend. */
export function ChangeLocationModal({ equipment, onClose, onSaved }: Props) {
  const t = useTranslations();
  const { airports, terminalsByAirport, floorsByTerminal, zonesByFloor } = useLocations();

  const [airportId, setAirportId] = useState(String(equipment.airport.id));
  const [terminalId, setTerminalId] = useState(equipment.terminal ? String(equipment.terminal.id) : "");
  const [floorId, setFloorId] = useState(equipment.floor ? String(equipment.floor.id) : "");
  const [zoneId, setZoneId] = useState(equipment.zone ? String(equipment.zone.id) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const airportOptions = airports.map((a) => ({ value: String(a.id), label: a.name }));
  const terminalOptions = airportId
    ? terminalsByAirport(Number(airportId)).map((t) => ({ value: String(t.id), label: t.name }))
    : [];
  const floorOptions = terminalId
    ? floorsByTerminal(Number(terminalId)).map((f) => ({ value: String(f.id), label: f.name }))
    : [];
  const zoneOptions = floorId
    ? zonesByFloor(Number(floorId)).map((z) => ({ value: String(z.id), label: z.name }))
    : [];

  async function handleSubmit() {
    if (!airportId) {
      setError(t("settingsCrud.requiredError"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await equipmentService.changeEquipmentLocation(equipment.id, {
        airportId: Number(airportId),
        terminalId: terminalId ? Number(terminalId) : undefined,
        floorId: floorId ? Number(floorId) : undefined,
        zoneId: zoneId ? Number(zoneId) : undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : t("settingsCrud.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("equipment.detail.changeLocationTitle")}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md border border-(--chip-error-border) bg-(--chip-error-bg) px-3 py-2 text-xs text-(--chip-error-text)">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dropdown
            label={t("equipment.form.airport")}
            required
            options={airportOptions}
            value={airportId}
            onChange={(v) => {
              setAirportId(v);
              setTerminalId("");
              setFloorId("");
              setZoneId("");
            }}
          />
          <Dropdown
            label={t("equipment.form.terminal")}
            disabled={!airportId}
            options={terminalOptions}
            value={terminalId}
            onChange={(v) => {
              setTerminalId(v);
              setFloorId("");
              setZoneId("");
            }}
          />
          <Dropdown
            label={t("equipment.form.floor")}
            disabled={!terminalId}
            options={floorOptions}
            value={floorId}
            onChange={(v) => {
              setFloorId(v);
              setZoneId("");
            }}
          />
          <Dropdown
            label={t("equipment.form.zone")}
            disabled={!floorId}
            options={zoneOptions}
            value={zoneId}
            onChange={setZoneId}
          />
        </div>
      </div>
    </Modal>
  );
}

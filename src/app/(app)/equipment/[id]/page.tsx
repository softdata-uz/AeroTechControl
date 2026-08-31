import { notFound } from "next/navigation";
import { equipmentById, airportName, inspections, faults, repairs, documents } from "@/lib/mock-data";
import { EquipmentDetailClient } from "./EquipmentDetailClient";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eq = equipmentById(id);
  if (!eq) notFound();

  const eqInspections = inspections.filter((i) => i.equipmentId === eq.id);
  const eqFaults = faults.filter((f) => f.equipmentId === eq.id);
  const eqRepairs = repairs.filter((r) => r.equipmentId === eq.id);
  const eqDocuments = documents.filter((d) => d.equipmentId === eq.id);

  return (
    <EquipmentDetailClient
      equipment={eq}
      airport={airportName(eq.airportId)}
      inspections={eqInspections}
      faults={eqFaults}
      repairs={eqRepairs}
      documents={eqDocuments}
    />
  );
}

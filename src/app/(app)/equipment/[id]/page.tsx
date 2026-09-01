import { EquipmentDetailClient } from "./EquipmentDetailClient";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EquipmentDetailClient equipmentId={Number(id)} />;
}

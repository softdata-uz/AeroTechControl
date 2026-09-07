"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EquipmentDetailClient } from "./EquipmentDetailClient";

function EquipmentViewInner() {
  const searchParams = useSearchParams();
  const equipmentId = Number(searchParams.get("id"));
  return <EquipmentDetailClient equipmentId={equipmentId} />;
}

export default function EquipmentDetailPage() {
  return (
    <Suspense fallback={null}>
      <EquipmentViewInner />
    </Suspense>
  );
}

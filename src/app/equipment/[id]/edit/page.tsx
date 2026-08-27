"use client";

import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { use } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentForm } from "../../EquipmentForm";
import { equipment, equipmentById } from "@/lib/mock-data";

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const eq = equipmentById(id);
  if (!eq) notFound();

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <PageHeader title={`Редактировать: ${eq.name}`} context={`${eq.code} · Реестр оборудования`} />
      <div className="px-6 pt-5">
        <EquipmentForm
          mode="edit"
          initial={eq}
          onCancel={() => router.push(`/equipment/${id}`)}
          onSubmit={(updated) => {
            const idx = equipment.findIndex((e) => e.id === id);
            if (idx !== -1) equipment[idx] = updated;
            router.push(`/equipment/${id}`);
          }}
        />
      </div>
    </div>
  );
}

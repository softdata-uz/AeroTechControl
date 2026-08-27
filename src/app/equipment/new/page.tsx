"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentForm } from "../EquipmentForm";
import { equipment } from "@/lib/mock-data";

export default function NewEquipmentPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <PageHeader title="Добавить оборудование" context="Реестр оборудования → Новая запись" />
      <div className="px-6 pt-5">
        <EquipmentForm
          mode="add"
          onCancel={() => router.push("/equipment")}
          onSubmit={(newItem) => {
            // Mock-only session state — see docs/IMPLEMENTATION_PLAN.md
            // for the mock-data → API swap-in path.
            equipment.unshift(newItem);
            router.push(`/equipment/${newItem.id}`);
          }}
        />
      </div>
    </div>
  );
}

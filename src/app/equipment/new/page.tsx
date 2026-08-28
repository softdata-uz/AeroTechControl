"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentForm } from "../EquipmentForm";
import { equipment } from "@/lib/mock-data";
import { useTranslations } from "@/lib/locale-context";

export default function NewEquipmentPage() {
  const router = useRouter();
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <PageHeader title={t("equipment.new.title")} context={t("equipment.new.context")} />
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

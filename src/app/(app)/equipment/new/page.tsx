"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentForm } from "../EquipmentForm";
import { equipmentService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

export default function NewEquipmentPage() {
  const router = useRouter();
  const t = useTranslations();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="pb-8">
      <PageHeader title={t("equipment.new.title")} context={t("equipment.new.context")} />
      <div className="mx-auto max-w-3xl px-6 pt-5">
        <EquipmentForm
          mode="add"
          submitting={submitting}
          onCancel={() => router.push("/equipment")}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const created = await equipmentService.createEquipment(values);
              router.push(`/equipment/${created.id}`);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EquipmentForm } from "../../EquipmentForm";
import { equipmentService } from "@/services";
import { useEquipmentDetail } from "@/hooks/useEquipmentDetail";
import { useTranslations } from "@/lib/locale-context";

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = Number(idParam);
  const router = useRouter();
  const t = useTranslations();
  const { data: eq, loading, error } = useEquipmentDetail(id);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="px-6 py-16 text-center text-sm text-text-tertiary">{t("equipment.loading")}</div>;
  }
  if (error || !eq) {
    return <div className="px-6 py-16 text-center text-sm text-text-secondary">{t("equipment.notFound")}</div>;
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={`${t("equipment.edit.titlePrefix")} ${eq.name}`}
        context={`${eq.code} · ${t("equipment.edit.contextSuffix")}`}
      />
      <div className="mx-auto max-w-3xl px-6 pt-5">
        <EquipmentForm
          mode="edit"
          initial={eq}
          submitting={submitting}
          onCancel={() => router.push(`/equipment/${id}`)}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              await equipmentService.updateEquipment(id, values);
              router.push(`/equipment/${id}`);
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { formatDateTime, resolveImageUrl, downloadFile } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";
import type { Equipment, EquipmentDocument } from "@/lib/types";

interface Props {
  document: EquipmentDocument;
  equipment: Equipment | null;
  typeLabel: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-secondary px-4 py-2.5 text-sm last:border-0">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-right text-text-primary">{value}</span>
    </div>
  );
}

export function DocumentDetailModal({ document, equipment, typeLabel, onClose }: Props) {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);

  return (
    <Modal
      open
      onClose={onClose}
      title={document.title}
      footer={
        <>
          <Button hierarchy="secondary" size="sm" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button
            hierarchy="primary"
            size="sm"
            onClick={() => {
              const url = resolveImageUrl(document.fileUrl);
              if (url) void downloadFile(url, document.title);
            }}
          >
            {t("documents.download")}
          </Button>
        </>
      }
    >
      <div className="-mx-4 -my-2 rounded-md border border-border-secondary">
        <Row label={t("documents.colDocument")} value={document.code} />
        <Row label={t("documents.colType")} value={typeLabel} />
        <Row
          label={t("documents.colEquipment")}
          value={equipment ? `${equipment.name} (${equipment.code})` : t("documents.genericDocument")}
        />
        {equipment && (
          <Row label={t("equipment.colStatus")} value={<StatusBadge status={equipmentStatusConfig[equipment.status]} />} />
        )}
        <Row label={t("documents.colAuthor")} value={document.author} />
        <Row label={t("documents.colOperator")} value={document.operatorName ?? "—"} />
        <Row label={t("documents.colCompanyRep")} value={document.companyRepresentativeName ?? "—"} />
        <Row label={t("documents.colDate")} value={formatDateTime(document.date)} />
      </div>
    </Modal>
  );
}

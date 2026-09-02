"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { getInspectionStatusConfig } from "@/config/inspectionStatus.config";
import { getFaultStatusConfig } from "@/config/faultStatus.config";
import { getRepairStatusConfig, getDocumentStatusConfig } from "@/config/repairStatus.config";
import { formatDate } from "@/lib/format";
import {
  useEquipmentDetail,
  useEquipmentInspectionHistory,
  useEquipmentFaultHistory,
} from "@/hooks/useEquipmentDetail";
import { useRepairsList } from "@/hooks/useRepairsList";
import { useDocumentsList } from "@/hooks/useDocumentsList";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const tabKeys = ["info", "inspections", "repairs", "faults", "documents"] as const;
const tabLabelKeys: Record<(typeof tabKeys)[number], TranslationKey> = {
  info: "equipment.detail.tabInfo",
  inspections: "equipment.detail.tabInspections",
  repairs: "equipment.detail.tabRepairs",
  faults: "equipment.detail.tabFaults",
  documents: "equipment.detail.tabDocuments",
};

type TabKey = (typeof tabKeys)[number];

interface Props {
  equipmentId: number;
}

export function EquipmentDetailClient({ equipmentId }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const inspectionStatusConfig = getInspectionStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);
  const repairStatusConfig = getRepairStatusConfig(t);
  const documentStatusConfig = getDocumentStatusConfig(t);
  const [tab, setTab] = useState<TabKey>("info");

  const { data: equipment, loading, error } = useEquipmentDetail(equipmentId);
  const { data: inspectionsData } = useEquipmentInspectionHistory(equipmentId);
  const { data: faultsData } = useEquipmentFaultHistory(equipmentId);
  const { data: repairsPage } = useRepairsList({ equipmentId, pageSize: 100 });
  const { data: documentsPage } = useDocumentsList({ equipmentId, pageSize: 100 });

  const inspections = inspectionsData ?? [];
  const faults = faultsData ?? [];
  const repairs = repairsPage?.items ?? [];
  const documents = documentsPage?.items ?? [];

  if (loading) {
    return <div className="px-6 py-16 text-center text-sm text-text-tertiary">{t("equipment.loading")}</div>;
  }
  if (error || !equipment) {
    return <div className="px-6 py-16 text-center text-sm text-text-secondary">{t("equipment.notFound")}</div>;
  }

  const tabsWithBadges = tabKeys.map((key) => ({
    key,
    label: t(tabLabelKeys[key]),
    badge:
      key === "inspections"
        ? inspections.length
        : key === "repairs"
          ? repairs.length
          : key === "faults"
            ? faults.length
            : key === "documents"
              ? documents.length
              : undefined,
  }));

  return (
    <div className="pb-8">
      <PageHeader
        title={equipment.name}
        context={`${equipment.code} · ${equipment.equipmentModel.name}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="qr-code" size="sm">
              {t("equipment.detail.qr")}
            </Button>
            <Button hierarchy="secondary" icon="edit" size="sm" onClick={() => router.push(`/equipment/${equipment.id}/edit`)}>
              {t("equipment.detail.edit")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-5 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-xl border-b border-border-secondary bg-bg-tertiary">
            {equipment.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- backend-served image, arbitrary origin
              <img src={equipment.imageUrl} alt={equipment.name} className="h-full w-full object-cover" />
            ) : (
              <Icon name="image" size={40} className="text-text-quaternary" />
            )}
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div>
              <StatusBadge status={equipmentStatusConfig[equipment.status]} />
            </div>
            <Row label={t("equipment.detail.airport")} value={equipment.airport.name} />
            <Row label={t("equipment.detail.location")} value={equipment.location ?? "—"} />
            <Row label={t("equipment.detail.manufacturerCompany")} value={equipment.manufacturerCompany.name} />
            <Row label={t("equipment.detail.model")} value={equipment.equipmentModel.name} />
            <Row label={t("equipment.detail.serialNumber")} value={equipment.serialNumber ?? "—"} />
            <Row label={t("equipment.detail.inventoryNumber")} value={equipment.inventoryNumber ?? "—"} />
            <Row label={t("equipment.detail.manufactureYear")} value={String(equipment.manufactureYear)} />
            <Row label={t("equipment.detail.nextInspection")} value={formatDate(equipment.nextInspectionAt)} />
          </div>
        </Card>

        <div>
          <Tabs items={tabsWithBadges} value={tab} onChange={setTab} />

          <div className="space-y-4 pt-4">
            {tab === "info" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("equipment.detail.groupIdentity")}</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Row label={t("equipment.detail.code")} value={equipment.code} />
                    <Row label={t("equipment.detail.name")} value={equipment.name} />
                    <Row label={t("equipment.detail.type")} value={equipment.equipmentType.name} />
                    <Row label={t("equipment.detail.model")} value={equipment.equipmentModel.name} />
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("equipment.detail.groupManufacturer")}</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Row label={t("equipment.detail.manufacturerCompany")} value={equipment.manufacturerCompany.name} />
                    <Row label={t("equipment.detail.manufacturerCountry")} value={equipment.manufacturerCountry.name} />
                    <Row label={t("equipment.detail.serialNumber")} value={equipment.serialNumber ?? "—"} />
                    <Row label={t("equipment.detail.inventoryNumber")} value={equipment.inventoryNumber ?? "—"} />
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("equipment.detail.groupLocation")}</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Row label={t("equipment.detail.airport")} value={equipment.airport.name} />
                    <Row label={t("equipment.detail.terminal")} value={equipment.terminal?.name ?? "—"} />
                    <Row label={t("equipment.detail.floor")} value={equipment.floor?.name ?? "—"} />
                    <Row label={t("equipment.detail.zone")} value={equipment.zone?.name ?? "—"} />
                    <Row label={t("equipment.detail.location")} value={equipment.location ?? "—"} />
                    <Row label={t("equipment.detail.operatedBy")} value={equipment.operatedBy.name} />
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("equipment.detail.groupLifecycle")}</CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Row label={t("equipment.detail.status")} value={equipmentStatusConfig[equipment.status].label} />
                    <Row label={t("equipment.detail.manufactureYear")} value={String(equipment.manufactureYear)} />
                    <Row
                      label={t("equipment.detail.purchaseYear")}
                      value={equipment.purchaseYear != null ? String(equipment.purchaseYear) : "—"}
                    />
                    <Row
                      label={t("equipment.detail.commissioningYear")}
                      value={equipment.commissioningYear != null ? String(equipment.commissioningYear) : "—"}
                    />
                    <Row
                      label={t("equipment.detail.serviceLifeExpiryYear")}
                      value={equipment.serviceLifeExpiryYear != null ? String(equipment.serviceLifeExpiryYear) : "—"}
                    />
                    <Row label={t("equipment.detail.lastInspection")} value={formatDate(equipment.lastInspectionAt)} />
                    <Row label={t("equipment.detail.nextInspection")} value={formatDate(equipment.nextInspectionAt)} />
                  </div>
                </Card>

                {equipment.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("equipment.detail.groupNotes")}</CardTitle>
                    </CardHeader>
                    <p className="whitespace-pre-wrap p-4 text-sm text-text-secondary">{equipment.notes}</p>
                  </Card>
                )}
              </>
            )}

            {tab === "inspections" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("equipment.detail.inspectionHistory")}</CardTitle>
                </CardHeader>
                {inspections.length === 0 ? (
                  <EmptyState label={t("equipment.detail.noInspections")} />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {inspections.map((ins) => (
                      <li key={ins.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-text-primary">{ins.id}</p>
                          <p className="text-xs text-text-tertiary">
                            {ins.regulation} · {ins.inspector}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-tertiary">
                            {formatDate(ins.completedAt ?? ins.scheduledAt)}
                          </span>
                          <StatusBadge status={inspectionStatusConfig[ins.status]} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === "repairs" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("equipment.detail.maintenanceRepairs")}</CardTitle>
                </CardHeader>
                {repairs.length === 0 ? (
                  <EmptyState label={t("equipment.detail.noRepairs")} />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {repairs.map((r) => (
                      <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-text-primary">{r.id}</p>
                          <p className="text-xs text-text-tertiary">
                            {t("equipment.detail.engineer")} {r.engineer} · {r.actualHours ?? r.estimatedHours}{" "}
                            {t("equipment.detail.hoursSuffix")}
                          </p>
                        </div>
                        <StatusBadge status={repairStatusConfig[r.status]} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === "faults" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("equipment.detail.faults")}</CardTitle>
                </CardHeader>
                {faults.length === 0 ? (
                  <EmptyState label={t("equipment.detail.noFaults")} />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {faults.map((f) => (
                      <li key={f.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{f.title}</p>
                          <p className="text-xs text-text-tertiary">
                            {f.code} · {formatDate(f.detectedAt)}
                          </p>
                        </div>
                        <StatusBadge status={faultStatusConfig[f.stage]} className="shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === "documents" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("equipment.detail.documents")}</CardTitle>
                </CardHeader>
                {documents.length === 0 ? (
                  <EmptyState label={t("equipment.detail.noDocuments")} />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {documents.map((d) => (
                      <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="flex items-center gap-2.5">
                          <Icon name="file-text" size={16} className="text-text-quaternary" />
                          <div>
                            <p className="font-medium text-text-primary">{d.title}</p>
                            <p className="text-xs text-text-tertiary">
                              {d.author} · {formatDate(d.date)} · v{d.version}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={documentStatusConfig[d.status]} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-text-tertiary">
      <Icon name="layers" size={24} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

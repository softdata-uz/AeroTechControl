"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { equipmentStatusConfig } from "@/config/equipmentStatus.config";
import { inspectionStatusConfig } from "@/config/inspectionStatus.config";
import { faultStatusConfig } from "@/config/faultStatus.config";
import { repairStatusConfig, documentStatusConfig } from "@/config/repairStatus.config";
import { formatDate } from "@/lib/format";
import { airportName } from "@/lib/mock-data";
import type { Equipment, Inspection, Fault, Repair, EquipmentDocument } from "@/lib/types";

const tabs = [
  { key: "info", label: "Информация" },
  { key: "inspections", label: "История проверок" },
  { key: "repairs", label: "ТО и ремонты" },
  { key: "faults", label: "Неисправности" },
  { key: "documents", label: "Документы" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface Props {
  equipment: Equipment;
  airport: string;
  inspections: Inspection[];
  faults: Fault[];
  repairs: Repair[];
  documents: EquipmentDocument[];
}

export function EquipmentDetailClient({ equipment, inspections, faults, repairs, documents }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("info");

  const tabsWithBadges = tabs.map((t) => ({
    ...t,
    badge:
      t.key === "inspections"
        ? inspections.length
        : t.key === "repairs"
          ? repairs.length
          : t.key === "faults"
            ? faults.length
            : t.key === "documents"
              ? documents.length
              : undefined,
  }));

  return (
    <div className="pb-8">
      <PageHeader
        title={equipment.name}
        context={`${equipment.code} · ${equipment.model}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="qr-code" size="sm">
              QR / NFC
            </Button>
            <Button hierarchy="secondary" icon="edit" size="sm" onClick={() => router.push(`/equipment/${equipment.id}/edit`)}>
              Редактировать
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 px-6 pt-5 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="flex aspect-video items-center justify-center rounded-t-xl border-b border-border-secondary bg-bg-tertiary">
            <Icon name="image" size={40} className="text-text-quaternary" />
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div>
              <StatusBadge status={equipmentStatusConfig[equipment.status]} />
            </div>
            <Row label="Аэропорт" value={airportName(equipment.airportId)} />
            <Row label="Место установки" value={equipment.location} />
            <Row label="Производитель" value={equipment.manufacturer} />
            <Row label="Модель" value={equipment.model} />
            <Row label="Серийный номер" value={equipment.serialNumber} />
            <Row label="Инв. номер" value={equipment.inventoryNumber} />
            <Row label="Дата ввода в эксплуатацию" value={formatDate(equipment.commissionedAt)} />
            <Row label="Следующая проверка" value={formatDate(equipment.nextInspectionAt)} />
          </div>
        </Card>

        <div>
          <Tabs items={tabsWithBadges} value={tab} onChange={setTab} />

          <div className="pt-4">
            {tab === "info" && (
              <Card>
                <CardHeader>
                  <CardTitle>Технические характеристики</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                  <Row label="Тип оборудования" value={equipment.type} />
                  <Row label="Идентификатор" value={equipment.id} />
                  <Row label="Терминал / Зона" value={equipment.location} />
                  <Row label="Статус" value={equipmentStatusConfig[equipment.status].label} />
                </div>
              </Card>
            )}

            {tab === "inspections" && (
              <Card>
                <CardHeader>
                  <CardTitle>История проверок</CardTitle>
                </CardHeader>
                {inspections.length === 0 ? (
                  <EmptyState label="Проверки не найдены" />
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
                  <CardTitle>ТО и ремонты</CardTitle>
                </CardHeader>
                {repairs.length === 0 ? (
                  <EmptyState label="Ремонты не найдены" />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {repairs.map((r) => (
                      <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-text-primary">{r.id}</p>
                          <p className="text-xs text-text-tertiary">
                            Инженер: {r.engineer} · {r.actualHours ?? r.estimatedHours} ч.
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
                  <CardTitle>Неисправности</CardTitle>
                </CardHeader>
                {faults.length === 0 ? (
                  <EmptyState label="Неисправности не найдены" />
                ) : (
                  <ul className="divide-y divide-border-secondary">
                    {faults.map((f) => (
                      <li key={f.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{f.title}</p>
                          <p className="text-xs text-text-tertiary">
                            {f.id} · {formatDate(f.detectedAt)}
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
                  <CardTitle>Документы</CardTitle>
                </CardHeader>
                {documents.length === 0 ? (
                  <EmptyState label="Документы не найдены" />
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

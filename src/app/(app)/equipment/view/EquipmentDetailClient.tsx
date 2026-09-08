"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { equipmentService, processSheetsApi } from "@/services";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { ChangeLocationModal } from "@/components/equipment/ChangeLocationModal";
import { ChangeOperatedByModal } from "@/components/equipment/ChangeOperatedByModal";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { getInspectionStatusConfig } from "@/config/inspectionStatus.config";
import { getFaultStatusConfig } from "@/config/faultStatus.config";
import { getRepairStatusConfig, getDocumentStatusConfig } from "@/config/repairStatus.config";
import { formatDate, resolveImageUrl, downloadFile } from "@/lib/format";
import {
  useEquipmentDetail,
  useEquipmentInspectionHistory,
  useEquipmentFaultHistory,
} from "@/hooks/useEquipmentDetail";
import { useRepairsList } from "@/hooks/useRepairsList";
import { useDocumentsList } from "@/hooks/useDocumentsList";
import { useTranslations } from "@/lib/locale-context";
import { usePermissions } from "@/hooks/usePermissions";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { EquipmentChangeLog, ProcessSheet } from "@/lib/types";

const tabKeys = ["info", "inspections", "repairs", "faults", "documents", "history"] as const;
const tabLabelKeys: Record<(typeof tabKeys)[number], TranslationKey> = {
  info: "equipment.detail.tabInfo",
  inspections: "equipment.detail.tabInspections",
  repairs: "equipment.detail.tabRepairs",
  faults: "equipment.detail.tabFaults",
  documents: "equipment.detail.tabDocuments",
  history: "equipment.detail.tabHistory",
};

type TabKey = (typeof tabKeys)[number];

interface Props {
  equipmentId: number;
}

export function EquipmentDetailClient({ equipmentId }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const { canWrite } = usePermissions();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  const inspectionStatusConfig = getInspectionStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);
  const repairStatusConfig = getRepairStatusConfig(t);
  const documentStatusConfig = getDocumentStatusConfig(t);
  const [tab, setTab] = useState<TabKey>("info");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [changeLocationOpen, setChangeLocationOpen] = useState(false);
  const [changeOperatedByOpen, setChangeOperatedByOpen] = useState(false);

  const [expandedRegIds, setExpandedRegIds] = useState<Set<number>>(new Set());
  const [processSheetsByReg, setProcessSheetsByReg] = useState<Record<number, ProcessSheet[]>>({});
  const [loadingRegIds, setLoadingRegIds] = useState<Set<number>>(new Set());

  const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
  const [historyItems, setHistoryItems] = useState<EquipmentChangeLog[] | null>(null);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(HISTORY_PAGE_SIZE_OPTIONS[0]);
  const [historyStale, setHistoryStale] = useState(true);

  const { data: equipment, loading, error, refetch } = useEquipmentDetail(equipmentId);
  const { data: inspectionsData } = useEquipmentInspectionHistory(equipmentId);
  const { data: faultsData } = useEquipmentFaultHistory(equipmentId);
  const { data: repairsPage } = useRepairsList({ equipmentId, pageSize: 100 });
  const { data: documentsPage } = useDocumentsList({ equipmentId, pageSize: 100 });

  useEffect(() => {
    if (tab !== "history" || !historyStale) return;
    let cancelled = false;
    setHistoryLoading(true);
    equipmentService
      .listEquipmentChangeHistory(equipmentId, { page: historyPage, pageSize: historyPageSize })
      .then((page) => {
        if (cancelled) return;
        setHistoryItems(page.items);
        setHistoryTotal(page.total);
        setHistoryStale(false);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, historyStale, historyPage, historyPageSize, equipmentId]);

  async function openQr() {
    setQrOpen(true);
    if (qrUrl || !equipment) return;
    if (equipment.qrCodeUrl) {
      setQrUrl(equipment.qrCodeUrl);
      return;
    }
    setQrLoading(true);
    try {
      const { qrCodeUrl } = await equipmentService.getEquipmentQrCode(equipment.id);
      setQrUrl(qrCodeUrl);
    } finally {
      setQrLoading(false);
    }
  }

  function toggleRegulation(regulationId: number) {
    setExpandedRegIds((prev) => {
      const next = new Set(prev);
      if (next.has(regulationId)) {
        next.delete(regulationId);
      } else {
        next.add(regulationId);
      }
      return next;
    });
    if (!processSheetsByReg[regulationId] && !loadingRegIds.has(regulationId)) {
      setLoadingRegIds((prev) => new Set(prev).add(regulationId));
      processSheetsApi
        .list(regulationId)
        .then((sheets) => {
          setProcessSheetsByReg((prev) => ({ ...prev, [regulationId]: sheets }));
        })
        .finally(() => {
          setLoadingRegIds((prev) => {
            const next = new Set(prev);
            next.delete(regulationId);
            return next;
          });
        });
    }
  }

  async function refreshAfterChange() {
    await refetch();
    setHistoryPage(1);
    setHistoryStale(true);
  }

  function changeHistoryPage(nextPage: number) {
    setHistoryPage(nextPage);
    setHistoryStale(true);
  }

  function changeHistoryPageSize(nextPageSize: number) {
    setHistoryPageSize(nextPageSize);
    setHistoryPage(1);
    setHistoryStale(true);
  }

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
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={equipment.name}
        context={`${equipment.code} · ${equipment.equipmentModel.name}`}
        onBack={() => router.push("/equipment")}
        actions={
          <>
            <Button hierarchy="secondary" icon="qr-code" size="sm" onClick={() => void openQr()}>
              {t("equipment.detail.qr")}
            </Button>
            {canWrite && (
              <Button hierarchy="secondary" icon="edit" size="sm" onClick={() => router.push(`/equipment/edit?id=${equipment.id}`)}>
                {t("equipment.detail.edit")}
              </Button>
            )}
          </>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-6 pt-5 pb-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-t-xl border-b border-border-secondary bg-bg-tertiary">
            {equipment.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- backend-served image, arbitrary origin
              <img src={resolveImageUrl(equipment.imageUrl) ?? undefined} alt={equipment.name} className="h-full w-full object-cover" />
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

        <div className="flex h-full min-h-0 flex-col">
          <Tabs items={tabsWithBadges} value={tab} onChange={setTab} />

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pt-4">
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
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => setChangeLocationOpen(true)}
                        className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-brand-400"
                        aria-label={t("equipment.detail.changeLocationTitle")}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                    )}
                  </CardHeader>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm">
                    <Row label={t("equipment.detail.airport")} value={equipment.airport.name} />
                    <Row label={t("equipment.detail.terminal")} value={equipment.terminal?.name ?? "—"} />
                    <Row label={t("equipment.detail.floor")} value={equipment.floor?.name ?? "—"} />
                    <Row label={t("equipment.detail.zone")} value={equipment.zone?.name ?? "—"} />
                    <Row label={t("equipment.detail.location")} value={equipment.location ?? "—"} />
                    <div className="col-span-2 flex items-center justify-between gap-3">
                      <span className="text-text-tertiary">{t("equipment.detail.operatedBy")}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-right font-medium text-text-primary">{equipment.operatedBy.name}</span>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => setChangeOperatedByOpen(true)}
                            className="rounded-md p-1 text-text-quaternary hover:bg-bg-quaternary hover:text-brand-400"
                            aria-label={t("equipment.detail.changeOperatedByTitle")}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        )}
                      </span>
                    </div>
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

                <Card>
                  <CardHeader>
                    <CardTitle>{t("equipment.detail.groupRegulations")}</CardTitle>
                  </CardHeader>
                  {equipment.regulations.length === 0 ? (
                    <EmptyState label={t("equipment.detail.noRegulations")} />
                  ) : (
                    <ul className="divide-y divide-border-secondary">
                      {equipment.regulations.map((regulation) => {
                        const expanded = expandedRegIds.has(regulation.id);
                        const sheets = processSheetsByReg[regulation.id];
                        const sheetsLoading = loadingRegIds.has(regulation.id);
                        return (
                          <li key={regulation.id}>
                            <button
                              type="button"
                              onClick={() => toggleRegulation(regulation.id)}
                              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm text-text-primary hover:bg-bg-tertiary"
                            >
                              <span className="font-medium">{regulation.name}</span>
                              <Icon
                                name="chevron-down"
                                size={16}
                                className={`shrink-0 text-text-quaternary transition-transform ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            {expanded && (
                              <div className="bg-bg-tertiary/40 px-4 pb-3 pl-8">
                                {sheetsLoading ? (
                                  <p className="py-2 text-xs text-text-tertiary">{t("common.loading")}</p>
                                ) : !sheets || sheets.length === 0 ? (
                                  <p className="py-2 text-xs text-text-tertiary">
                                    {t("equipment.detail.noProcessSheets")}
                                  </p>
                                ) : (
                                  <ul className="space-y-1.5 py-2">
                                    {sheets.map((sheet) => (
                                      <li key={sheet.id} className="flex items-center gap-2 text-xs text-text-secondary">
                                        <Icon name="clipboard-check" size={13} className="text-text-quaternary" />
                                        {sheet.name}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
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

            {tab === "history" && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{t("equipment.detail.changeHistory")}</CardTitle>
                </CardHeader>
                {historyLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-text-tertiary">{t("common.loading")}</p>
                ) : !historyItems || historyItems.length === 0 ? (
                  <EmptyState label={t("equipment.detail.noHistory")} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-secondary text-left text-xs text-text-quaternary">
                          <th className="px-4 py-2 font-medium">{t("equipment.detail.historyField")}</th>
                          <th className="px-4 py-2 font-medium">{t("equipment.detail.historyFrom")}</th>
                          <th className="px-4 py-2 font-medium">{t("equipment.detail.historyTo")}</th>
                          <th className="px-4 py-2 font-medium">{t("equipment.detail.historyChangedBy")}</th>
                          <th className="px-4 py-2 font-medium">{t("equipment.detail.historyWhen")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-secondary">
                        {historyItems.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-4 py-2.5 font-medium text-text-primary">
                              {entry.field === "location"
                                ? t("equipment.detail.groupLocation")
                                : t("equipment.detail.operatedBy")}
                            </td>
                            <td className="px-4 py-2.5 text-text-secondary">{entry.fromValue}</td>
                            <td className="px-4 py-2.5 text-text-secondary">{entry.toValue}</td>
                            <td className="px-4 py-2.5 text-text-secondary">
                              {entry.changedBy?.name ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-text-tertiary">
                              {formatDate(entry.changedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {!historyLoading && historyItems && historyItems.length > 0 && (
                  <PaginationBar
                    page={historyPage}
                    pageSize={historyPageSize}
                    total={historyTotal}
                    onPageChange={changeHistoryPage}
                    onPageSizeChange={changeHistoryPageSize}
                    pageSizeOptions={HISTORY_PAGE_SIZE_OPTIONS}
                  />
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={t("equipment.detail.qrTitle")}>
        {qrLoading ? (
          <p className="py-6 text-center text-sm text-text-tertiary">{t("common.loading")}</p>
        ) : qrUrl ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- backend-served image, arbitrary origin */}
            <img
              src={resolveImageUrl(qrUrl) ?? undefined}
              alt={equipment.serialNumber}
              className="h-48 w-48 rounded-md border border-border-secondary bg-white p-2"
            />
            <Button
              hierarchy="primary"
              icon="download"
              size="sm"
              onClick={() => {
                const url = resolveImageUrl(qrUrl);
                if (url) void downloadFile(url, `${equipment.code}-qr.png`);
              }}
            >
              {t("equipment.detail.qrDownload")}
            </Button>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-text-tertiary">{t("equipment.detail.qrNotAvailable")}</p>
        )}
      </Modal>

      {changeLocationOpen && (
        <ChangeLocationModal
          equipment={equipment}
          onClose={() => setChangeLocationOpen(false)}
          onSaved={refreshAfterChange}
        />
      )}

      {changeOperatedByOpen && (
        <ChangeOperatedByModal
          equipment={equipment}
          onClose={() => setChangeOperatedByOpen(false)}
          onSaved={refreshAfterChange}
        />
      )}
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

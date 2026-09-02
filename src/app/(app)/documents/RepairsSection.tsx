"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/data-display/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { getRepairStatusConfig } from "@/config/repairStatus.config";
import { getFaultStatusConfig } from "@/config/faultStatus.config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { RepairStatus } from "@/lib/types";
import { useRepairsList } from "@/hooks/useRepairsList";
import { useEquipmentLookup } from "@/hooks/useEquipmentLookup";
import { useAsync } from "@/hooks/useAsync";
import { repairsService, faultsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { usePermissions } from "@/hooks/usePermissions";

const REPAIR_STATUS_ORDER: RepairStatus[] = ["planned", "in_progress", "waiting_parts", "completed", "verified"];

export function RepairsSection() {
  const t = useTranslations();
  const { canWrite } = usePermissions();
  const repairStatusConfig = getRepairStatusConfig(t);
  const faultStatusConfig = getFaultStatusConfig(t);
  const { equipmentById } = useEquipmentLookup();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingPart, setAddingPart] = useState(false);
  const [partInputOpen, setPartInputOpen] = useState(false);
  const [partName, setPartName] = useState("");

  const { data, loading, error, refetch } = useRepairsList({ pageSize: 1000 });
  const repairs = useMemo(() => data?.items ?? [], [data]);
  const { data: faultsPage } = useAsync(() => faultsService.listFaults({ pageSize: 200 }), []);
  const faultsById = useMemo(() => {
    const map = new Map(faultsPage?.items.map((f) => [f.id, f]));
    return (id: number) => map.get(id);
  }, [faultsPage]);

  const kpi = useMemo(() => {
    const total = repairs.length;
    const inProgress = repairs.filter((r) => r.status === "in_progress").length;
    const waitingParts = repairs.filter((r) => r.status === "waiting_parts").length;
    const completed = repairs.filter((r) => r.status === "completed").length;
    const verified = repairs.filter((r) => r.status === "verified").length;
    return { total, inProgress, waitingParts, completed, verified };
  }, [repairs]);

  useEffect(() => {
    if (repairs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!repairs.some((r) => r.id === selectedId)) {
      setSelectedId(repairs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairs]);

  useEffect(() => {
    setPartInputOpen(false);
    setPartName("");
  }, [selectedId]);

  const selected = repairs.find((r) => r.id === selectedId) ?? null;
  const { data: selectedFault } = useAsync(
    () => (selected ? faultsService.getFault(selected.faultId) : Promise.resolve(null)),
    [selected?.faultId]
  );
  const selectedEq = selected ? equipmentById(selected.equipmentId) : null;
  const nextStatus = selected
    ? REPAIR_STATUS_ORDER[REPAIR_STATUS_ORDER.indexOf(selected.status) + 1]
    : undefined;

  async function handleAdvanceStatus() {
    if (!selected || !nextStatus) return;
    setUpdatingStatus(true);
    try {
      await repairsService.updateRepairStatus(selected.id, nextStatus);
      await refetch();
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddPart() {
    if (!selected || !partName.trim()) return;
    setAddingPart(true);
    try {
      await repairsService.addRepairPart(selected.id, partName.trim());
      await refetch();
      setPartName("");
      setPartInputOpen(false);
    } finally {
      setAddingPart(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-5">
        <KPICard label={t("repairs.kpiTotal")} value={kpi.total} icon="wrench" tone="neutral" />
        <KPICard label={t("repairs.kpiInProgress")} value={kpi.inProgress} icon="clock" tone="warning" />
        <KPICard label={t("repairs.kpiWaitingParts")} value={kpi.waitingParts} icon="package" tone="brand" />
        <KPICard label={t("repairs.kpiCompleted")} value={kpi.completed} icon="check-circle" tone="success" />
        <KPICard label={t("repairs.kpiVerified")} value={kpi.verified} icon="shield" tone="success" />
      </div>

      <div className="flex items-center justify-end px-6 pt-4">
        {canWrite && (
          <Button hierarchy="primary" icon="plus" size="sm">
            {t("repairs.newRepair")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("repairs.loadError")}</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              {t("repairs.loading")}
            </div>
          ) : repairs.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("repairs.notFound")}</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("repairs.colId")}</th>
                  <th className="px-4 py-2.5">{t("repairs.colEquipment")}</th>
                  <th className="px-4 py-2.5">{t("repairs.colFault")}</th>
                  <th className="px-4 py-2.5">{t("repairs.colEngineer")}</th>
                  <th className="px-4 py-2.5">{t("repairs.colStatus")}</th>
                  <th className="px-4 py-2.5">{t("repairs.colHours")}</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r) => {
                  const eq = equipmentById(r.equipmentId);
                  const fault = faultsById(r.faultId);
                  const active = r.id === selectedId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        "cursor-pointer border-b border-border-secondary transition-colors last:border-0",
                        active ? "bg-bg-tertiary" : "hover:bg-bg-tertiary"
                      )}
                    >
                      <td className="px-4 py-2.5 font-medium text-brand-400">{r.id}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-text-primary">{eq?.name}</p>
                        <p className="text-xs text-text-tertiary">{eq?.code}</p>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-2.5 text-text-secondary">{fault?.title}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{r.engineer}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={repairStatusConfig[r.status]} />
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">
                        {r.estimatedHours} / {r.actualHours ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {selected ? (
          <Card className="h-fit">
            <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{selected.id}</p>
                <p className="text-xs text-text-tertiary">
                  {t("repairs.startedPrefix")} {formatDate(selected.startedAt)}
                </p>
              </div>
              <StatusBadge status={repairStatusConfig[selected.status]} />
            </div>

            <div className="space-y-4 p-4 text-sm">
              {selectedEq && (
                <Link
                  href={`/equipment/${selectedEq.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-primary p-3 transition-colors hover:border-brand-600"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary">
                    <Icon name="cpu" size={18} className="text-text-tertiary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{selectedEq.name}</p>
                    <p className="truncate text-xs text-text-tertiary">
                      {selectedEq.code} · {selectedEq.airport.name}
                    </p>
                  </div>
                </Link>
              )}

              {selectedFault && (
                <div>
                  <p className="mb-1 text-xs font-medium text-text-quaternary">{t("repairs.relatedFault")}</p>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border-primary bg-bg-primary p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{selectedFault.title}</p>
                      <p className="text-xs text-text-tertiary">{selectedFault.code}</p>
                    </div>
                    <StatusBadge status={faultStatusConfig[selectedFault.stage]} className="shrink-0" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("repairs.fieldEngineer")} value={selected.engineer} />
                <Field label={t("repairs.fieldEstimatedDuration")} value={`${selected.estimatedHours} ${t("equipment.detail.hoursSuffix")}`} />
                <Field label={t("repairs.fieldActualDuration")} value={selected.actualHours ? `${selected.actualHours} ${t("equipment.detail.hoursSuffix")}` : "—"} />
                <Field label={t("repairs.fieldCompletedAt")} value={formatDate(selected.completedAt)} />
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-text-quaternary">{t("repairs.usedParts")}</p>
                {selected.partsUsed.length === 0 ? (
                  <p className="text-xs text-text-quaternary">{t("repairs.noPartsUsed")}</p>
                ) : (
                  <ul className="space-y-1">
                    {selected.partsUsed.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-text-secondary">
                        <Icon name="package" size={14} className="text-text-quaternary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {partInputOpen && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      placeholder={t("repairs.partNamePlaceholder")}
                      className="flex-1"
                      value={partName}
                      onChange={(e) => setPartName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPart()}
                      autoFocus
                    />
                    <Button
                      hierarchy="primary"
                      size="sm"
                      onClick={handleAddPart}
                      disabled={addingPart || !partName.trim()}
                    >
                      {addingPart ? "…" : "OK"}
                    </Button>
                  </div>
                )}
              </div>

              {selected.verificationResult && (
                <div className="flex items-center gap-2 rounded-lg border border-(--chip-success-border) bg-(--chip-success-bg) p-3 text-(--chip-success-text)">
                  <Icon name="check-circle" size={16} />
                  <span className="text-sm font-medium">{t("repairs.verificationPassed")}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border-secondary p-4">
              <Button
                hierarchy="primary"
                className="w-full justify-center"
                size="sm"
                onClick={handleAdvanceStatus}
                disabled={updatingStatus || !nextStatus}
              >
                {updatingStatus
                  ? t("repairs.updating")
                  : nextStatus
                  ? `${t("repairs.moveToStatusPrefix")}${repairStatusConfig[nextStatus].label}${t("repairs.moveToStatusSuffix")}`
                  : t("repairs.updateStatus")}
              </Button>
              <Button
                hierarchy="secondary"
                className="w-full justify-center"
                size="sm"
                onClick={() => setPartInputOpen((v) => !v)}
              >
                {t("repairs.addPart")}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-10 text-sm text-text-tertiary">
            {t("repairs.selectFromList")}
          </Card>
        )}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs text-text-quaternary">{label}</p>
      <p className="font-medium text-text-primary">{value}</p>
    </div>
  );
}

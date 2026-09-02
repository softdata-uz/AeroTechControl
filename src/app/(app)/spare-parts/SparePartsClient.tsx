"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/data-display/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { getSparePartStatusConfig } from "@/config/repairStatus.config";
import { cn } from "@/lib/cn";
import type { SparePartStatus } from "@/lib/types";
import { useSparePartsList } from "@/hooks/useSparePartsList";
import { useAsync } from "@/hooks/useAsync";
import { sparePartsService } from "@/services";
import { useTranslations } from "@/lib/locale-context";

type PendingAction = "reserve" | "consume" | null;

export function SparePartsClient() {
  const t = useTranslations();
  const sparePartStatusConfig = getSparePartStatusConfig(t);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<SparePartStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filters = {
    warehouse: warehouseFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    pageSize: 100,
  };

  const { data, loading, error, refetch } = useSparePartsList(filters);
  const spareParts = useMemo(() => data?.items ?? [], [data]);

  // KPI cards and warehouse options reflect the full catalog, independent of the table filters.
  const { data: allPartsPage, refetch: refetchKpi } = useAsync(
    () => sparePartsService.listSpareParts({ pageSize: 1000 }),
    []
  );
  const allParts = useMemo(() => allPartsPage?.items ?? [], [allPartsPage]);
  const warehouses = useMemo(() => Array.from(new Set(allParts.map((p) => p.warehouse))), [allParts]);
  const kpi = useMemo(
    () => ({
      total: allParts.length,
      available: allParts.filter((p) => p.status === "available").length,
      lowStock: allParts.filter((p) => p.status === "low_stock").length,
      reserved: allParts.filter((p) => p.status === "reserved").length,
      outOfStock: allParts.filter((p) => p.status === "out_of_stock").length,
    }),
    [allParts]
  );

  // Keep a valid selection whenever the visible list changes.
  useEffect(() => {
    if (spareParts.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!spareParts.some((p) => p.id === selectedId)) {
      setSelectedId(spareParts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spareParts]);

  useEffect(() => {
    setPendingAction(null);
    setQuantity("1");
  }, [selectedId]);

  const selected = spareParts.find((p) => p.id === selectedId) ?? null;

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      await sparePartsService.exportSpareParts({
        warehouse: warehouseFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleConfirmAction() {
    if (!selected || !pendingAction) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return;
    setSubmitting(true);
    try {
      if (pendingAction === "reserve") {
        await sparePartsService.reserveSparePart(selected.id, qty);
      } else {
        await sparePartsService.consumeSparePart(selected.id, qty);
      }
      await Promise.all([refetch(), refetchKpi()]);
      setPendingAction(null);
      setQuantity("1");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={t("spareParts.title")}
        context={`${t("spareParts.totalNomenclature")} ${kpi.total}`}
        actions={
          <>
            <Button hierarchy="secondary" icon="download" size="sm" disabled={exporting} onClick={handleExport}>
              {t("common.export")}
            </Button>
            <Button hierarchy="primary" icon="plus" size="sm">
              {t("spareParts.addNomenclature")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label={t("spareParts.kpiAvailable")} value={kpi.available} icon="check-circle" tone="success" />
        <KPICard label={t("spareParts.kpiLowStock")} value={kpi.lowStock} icon="alert-triangle" tone="warning" />
        <KPICard label={t("spareParts.kpiReserved")} value={kpi.reserved} icon="layers" tone="brand" />
        <KPICard label={t("spareParts.kpiOutOfStock")} value={kpi.outOfStock} icon="package" tone="error" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
        <Dropdown
          className="w-56"
          placeholder={t("common.allWarehouses")}
          value={warehouseFilter}
          onChange={setWarehouseFilter}
          options={warehouses.map((w) => ({ value: w, label: w }))}
        />
        <Dropdown
          className="w-56"
          placeholder={t("common.allStatuses")}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as SparePartStatus | "")}
          options={Object.entries(sparePartStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
        />
        <div className="flex-1" />
        <Input
          icon="search"
          placeholder={t("spareParts.searchPlaceholder")}
          className="w-72"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("spareParts.loadError")}</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              {t("spareParts.loading")}
            </div>
          ) : spareParts.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("spareParts.notFound")}</p>
              <p className="text-xs text-text-tertiary">{t("spareParts.changeFilters")}</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("spareParts.colName")}</th>
                  <th className="px-4 py-2.5">{t("spareParts.colSku")}</th>
                  <th className="px-4 py-2.5">{t("spareParts.colWarehouse")}</th>
                  <th className="px-4 py-2.5">{t("spareParts.colStockMin")}</th>
                  <th className="px-4 py-2.5">{t("spareParts.colReserved")}</th>
                  <th className="px-4 py-2.5">{t("spareParts.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "cursor-pointer border-b border-border-secondary transition-colors last:border-0",
                        active ? "bg-bg-tertiary" : "hover:bg-bg-tertiary"
                      )}
                    >
                      <td className="px-4 py-2.5 font-medium text-text-primary">{p.name}</td>
                      <td className="px-4 py-2.5 text-brand-400">{p.sku}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.warehouse}</td>
                      <td className="px-4 py-2.5 text-text-secondary">
                        <span
                          className={cn(
                            "font-medium",
                            p.stock < p.minStock ? "text-error-400" : "text-text-primary"
                          )}
                        >
                          {p.stock}
                        </span>{" "}
                        / {p.minStock}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{p.reserved}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={sparePartStatusConfig[p.status]} />
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
                <p className="text-sm font-semibold text-text-primary">{selected.name}</p>
                <p className="text-xs text-text-tertiary">{selected.sku}</p>
              </div>
              <StatusBadge status={sparePartStatusConfig[selected.status]} />
            </div>

            <div className="space-y-4 p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("spareParts.fieldWarehouse")} value={selected.warehouse} />
                <Field label={t("spareParts.fieldStock")} value={String(selected.stock)} />
                <Field label={t("spareParts.fieldMinStock")} value={String(selected.minStock)} />
                <Field label={t("spareParts.fieldReserved")} value={String(selected.reserved)} />
              </div>

              <div className="rounded-lg border border-border-primary bg-bg-primary p-3">
                <p className="mb-1.5 flex items-center justify-between text-xs text-text-tertiary">
                  <span>{t("spareParts.stockLevel")}</span>
                  <span>
                    {selected.stock} / {selected.minStock * 2}
                  </span>
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      selected.stock === 0
                        ? "bg-error-500"
                        : selected.stock < selected.minStock
                        ? "bg-warning-500"
                        : "bg-success-500"
                    )}
                    style={{
                      width: `${Math.min((selected.stock / (selected.minStock * 2)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-text-quaternary">{t("spareParts.compatibleEquipment")}</p>
                <ul className="space-y-1">
                  {selected.compatibleEquipmentTypes.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-text-secondary">
                      <Icon name="cpu" size={14} className="text-text-quaternary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2 border-t border-border-secondary p-4">
              <Button hierarchy="primary" className="w-full justify-center" size="sm">
                {t("spareParts.placeOrder")}
              </Button>

              {pendingAction ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    className="flex-1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConfirmAction()}
                    autoFocus
                  />
                  <Button hierarchy="primary" size="sm" onClick={handleConfirmAction} disabled={submitting}>
                    {submitting ? "…" : "OK"}
                  </Button>
                  <Button hierarchy="secondary" size="sm" onClick={() => setPendingAction(null)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    hierarchy="secondary"
                    className="w-full justify-center"
                    size="sm"
                    onClick={() => setPendingAction("reserve")}
                  >
                    {t("spareParts.reserve")}
                  </Button>
                  <Button
                    hierarchy="secondary"
                    className="w-full justify-center"
                    size="sm"
                    onClick={() => setPendingAction("consume")}
                    disabled={selected.stock === 0}
                  >
                    {t("spareParts.writeOff")}
                  </Button>
                </>
              )}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-10 text-sm text-text-tertiary">
            {t("spareParts.selectFromList")}
          </Card>
        )}
      </div>
    </div>
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

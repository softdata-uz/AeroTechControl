"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KPICard } from "@/components/data-display/KPICard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Icon, type IconName } from "@/components/icons";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { getDocumentStatusConfig } from "@/config/repairStatus.config";
import { useEquipmentLookup } from "@/hooks/useEquipmentLookup";
import { formatDate } from "@/lib/format";
import type { DocumentStatus, EquipmentDocument } from "@/lib/types";
import { useDocumentsList } from "@/hooks/useDocumentsList";
import { useAsync } from "@/hooks/useAsync";
import { documentsService } from "@/services";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { useTranslations } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n/translations";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const typeMetaKeys: Record<EquipmentDocument["type"], { labelKey: TranslationKey; icon: IconName }> = {
  certificate: { labelKey: "documents.type.certificate", icon: "shield" },
  act: { labelKey: "documents.type.act", icon: "clipboard-check" },
  protocol: { labelKey: "documents.type.protocol", icon: "file-text" },
  manual: { labelKey: "documents.type.manual", icon: "layers" },
  repair_report: { labelKey: "documents.type.repairReport", icon: "wrench" },
};

export function DocumentsSection() {
  const t = useTranslations();
  const { equipmentById } = useEquipmentLookup();
  const documentStatusConfig = getDocumentStatusConfig(t);
  const typeMeta: Record<EquipmentDocument["type"], { label: string; icon: IconName }> = Object.fromEntries(
    Object.entries(typeMetaKeys).map(([key, m]) => [key, { label: t(m.labelKey), icon: m.icon }])
  ) as Record<EquipmentDocument["type"], { label: string; icon: IconName }>;
  const [typeFilter, setTypeFilter] = useState<EquipmentDocument["type"] | "">("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, search, pageSize]);

  const filters = {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    pageSize,
  };

  const { data, loading, error, refetch } = useDocumentsList(filters);
  const documents = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // KPI cards reflect the full document set, independent of the table filters.
  const { data: allDocsPage, refetch: refetchKpi } = useAsync(
    () => documentsService.listDocuments({ pageSize: 1000 }),
    []
  );
  const kpi = useMemo(() => {
    const all = allDocsPage?.items ?? [];
    return {
      total: all.length,
      active: all.filter((d) => d.status === "active").length,
      expiring: all.filter((d) => d.status === "expiring").length,
      expired: all.filter((d) => d.status === "expired").length,
      archived: all.filter((d) => d.status === "archived").length,
    };
  }, [allDocsPage]);

  function handleDocumentCreated() {
    refetch();
    refetchKpi();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label={t("documents.kpiActive")} value={kpi.active} icon="check-circle" tone="success" />
        <KPICard label={t("documents.kpiExpiring")} value={kpi.expiring} icon="clock" tone="warning" />
        <KPICard label={t("documents.kpiExpired")} value={kpi.expired} icon="alert-triangle" tone="error" />
        <KPICard label={t("documents.kpiArchived")} value={kpi.archived} icon="layers" tone="neutral" />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-6 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            className="w-56"
            placeholder={t("documents.allTypes")}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as EquipmentDocument["type"] | "")}
            options={Object.entries(typeMeta).map(([key, m]) => ({ value: key, label: m.label, icon: m.icon }))}
          />
          <Dropdown
            className="w-56"
            placeholder={t("common.allStatuses")}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as DocumentStatus | "")}
            options={Object.entries(documentStatusConfig).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
          />
          <Input
            icon="search"
            placeholder={t("documents.searchPlaceholder")}
            className="w-72"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button hierarchy="primary" icon="upload" size="sm" onClick={() => setUploadOpen(true)}>
          {t("documents.upload")}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
          <div className="min-h-0 flex-1">
          {error ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("documents.loadError")}</p>
              <p className="text-xs text-text-tertiary">{error}</p>
              <Button hierarchy="secondary" size="sm" onClick={refetch}>
                {t("common.retry")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-text-tertiary">
              {t("documents.loading")}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-16 text-center">
              <p className="text-sm text-text-secondary">{t("documents.notFound")}</p>
              <p className="text-xs text-text-tertiary">{t("documents.changeFilters")}</p>
            </div>
          ) : (
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-bg-secondary">
                <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                  <th className="px-4 py-2.5">{t("documents.colDocument")}</th>
                  <th className="px-4 py-2.5">{t("documents.colEquipment")}</th>
                  <th className="px-4 py-2.5">{t("documents.colAuthor")}</th>
                  <th className="px-4 py-2.5">{t("documents.colDate")}</th>
                  <th className="px-4 py-2.5">{t("documents.colVersion")}</th>
                  <th className="px-4 py-2.5">{t("documents.colStatus")}</th>
                  <th className="px-4 py-2.5 text-right">{t("documents.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => {
                  const eq = d.equipmentId ? equipmentById(d.equipmentId) : null;
                  const meta = typeMeta[d.type];
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-tertiary text-text-tertiary">
                            <Icon name={meta.icon} size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-text-primary">{d.title}</p>
                            <p className="text-xs text-text-tertiary">{meta.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">
                        {eq ? (
                          <Link href={`/equipment/${eq.id}`} className="hover:text-brand-400">
                            {eq.code}
                          </Link>
                        ) : (
                          <span className="text-text-quaternary">{t("documents.genericDocument")}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{d.author}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatDate(d.date)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">v{d.version}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={documentStatusConfig[d.status]} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={t("documents.view")}
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            aria-label={t("documents.download")}
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                          >
                            <Icon name="download" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-border-primary px-4 py-3 text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <span>{t("common.showingPerPage")}</span>
              <Dropdown
                className="w-20"
                value={String(pageSize)}
                onChange={(value) => setPageSize(Number(value))}
                options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <span>
                {rangeStart}–{rangeEnd} {t("common.of")} {total} {t("common.records")}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </div>
        </div>
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={handleDocumentCreated}
        typeMeta={typeMeta}
      />
    </div>
  );
}

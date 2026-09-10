"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/settings/ConfirmDialog";
import { SignatoryFormModal } from "@/components/settings/SignatoryFormModal";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useLocations } from "@/hooks/useLocations";
import { signatoriesService, ApiException } from "@/services";
import { useTranslations } from "@/lib/locale-context";
import { formatDateTime } from "@/lib/format";
import type { Signatory } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function SettingsSignatoriesPage() {
  const t = useTranslations();
  const { airports, airportName, loading: airportsLoading } = useLocations();

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ initial: Signatory | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, signatories.length]);

  const pageItems = useMemo(
    () => signatories.slice((page - 1) * pageSize, page * pageSize),
    [signatories, page, pageSize]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    return signatoriesService
      .list()
      .then(setSignatories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleDelete() {
    if (deleteTarget == null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await signatoriesService.remove(deleteTarget);
      setDeleteTarget(null);
      await refetch();
    } catch (err) {
      setDeleteError(
        err instanceof ApiException && err.status === 409
          ? t("settingsCrud.conflictError")
          : t("settingsCrud.genericError")
      );
    } finally {
      setDeleting(false);
    }
  }

  const typeLabel = (type: Signatory["type"]) =>
    type === "operator" ? t("settingsCrud.signatoryTypeOperator") : t("settingsCrud.signatoryTypeCompanyRep");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={t("settingsCrud.signatoriesPageTitle")}
        context={t("settingsCrud.signatoriesPageContext")}
      />

      <div className="min-h-0 flex-1 px-6 pb-6 pt-5">
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-secondary px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{t("settingsCrud.signatoryLabel")}</p>
            <button
              onClick={() => setForm({ initial: null })}
              className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Icon name="plus" size={14} />
              {t("settingsCrud.signatoryLabel")}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {loading || airportsLoading ? (
              <p className="px-4 py-6 text-sm text-text-tertiary">{t("common.loading")}</p>
            ) : signatories.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-tertiary">{t("settingsCrud.empty")}</p>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-bg-secondary">
                  <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
                    <th className="px-4 py-2.5">{t("settingsCrud.signatoryFullName")}</th>
                    <th className="px-4 py-2.5">{t("settingsCrud.signatoryAirport")}</th>
                    <th className="px-4 py-2.5">{t("settingsCrud.signatoryType")}</th>
                    <th className="px-4 py-2.5">{t("settingsCrud.signatoryCreatedAt")}</th>
                    <th className="px-4 py-2.5 text-right">{t("documents.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
                    >
                      <td className="px-4 py-2.5 font-medium text-text-primary">{s.fullName}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{airportName(s.airportId)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{typeLabel(s.type)}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label={t("common.edit")}
                            onClick={() => setForm({ initial: s })}
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-brand-400"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            aria-label={t("common.delete")}
                            onClick={() => setDeleteTarget(s.id)}
                            className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-error-400"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={signatories.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </Card>
      </div>

      {form && (
        <SignatoryFormModal
          key={form.initial?.id ?? "new"}
          onClose={() => setForm(null)}
          onSaved={refetch}
          airports={airports}
          initial={form.initial}
          create={signatoriesService.create}
          update={signatoriesService.update}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={t("settingsCrud.deleteConfirmTitle")}
        message={deleteError ?? t("settingsCrud.deleteConfirmMessage")}
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}

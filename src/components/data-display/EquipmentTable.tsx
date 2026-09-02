"use client";

import Link from "next/link";
import type { Equipment } from "@/lib/types";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";

interface EquipmentTableProps {
  items: Equipment[];
  /** compact: dashboard/location panels (fewer columns). full: the Equipment Registry page (every column + row actions). */
  compact?: boolean;
  full?: boolean;
  /** Fills a bounded-height flex parent and scrolls internally (both axes) instead of expanding with the page — the Equipment Registry page's fixed-header layout. */
  scrollable?: boolean;
}

function Thumbnail({ equipment }: { equipment: Equipment }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-tertiary">
      {equipment.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- small backend-served thumbnail, arbitrary origin
        <img src={equipment.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon name="cpu" size={15} className="text-text-quaternary" />
      )}
    </div>
  );
}

export function EquipmentTable({ items, compact = false, full = false, scrollable = false }: EquipmentTableProps) {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  return (
    <div className={scrollable ? "h-full overflow-auto" : "overflow-x-auto"}>
      <table className={full ? "w-full min-w-[1140px] border-collapse text-sm" : "w-full min-w-[860px] border-collapse text-sm"}>
        <thead className="sticky top-0 z-10 bg-bg-secondary">
          <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
            {full && <th className="px-4 py-2.5">{t("equipment.colImage")}</th>}
            <th className="px-4 py-2.5">{t("equipment.colEquipment")}</th>
            <th className="px-4 py-2.5">{t("equipment.colType")}</th>
            {full && <th className="px-4 py-2.5">{t("equipment.colModel")}</th>}
            {full && <th className="px-4 py-2.5">{t("equipment.colManufacturer")}</th>}
            {!compact && <th className="px-4 py-2.5">{t("equipment.colAirport")}</th>}
            {full && <th className="px-4 py-2.5">{t("equipment.colTerminalZone")}</th>}
            {full && <th className="px-4 py-2.5">{t("equipment.colOperatedBy")}</th>}
            <th className="px-4 py-2.5">{t("equipment.colStatus")}</th>
            {full && <th className="px-4 py-2.5">{t("equipment.colManufactureYear")}</th>}
            {!compact && <th className="px-4 py-2.5">{t("equipment.colNextInspection")}</th>}
            <th className="px-4 py-2.5 text-right">{t("equipment.colActions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((eq) => (
            <tr
              key={eq.id}
              className="border-b border-border-secondary transition-colors last:border-0 hover:bg-bg-tertiary"
            >
              {full && (
                <td className="px-4 py-2.5">
                  <Thumbnail equipment={eq} />
                </td>
              )}
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  {!full && <Thumbnail equipment={eq} />}
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{eq.name}</p>
                    <p className="text-xs text-text-tertiary">{eq.serialNumber}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-text-secondary">{eq.equipmentType.name}</td>
              {full && <td className="px-4 py-2.5 text-text-secondary">{eq.equipmentModel.name}</td>}
              {full && (
                <td className="px-4 py-2.5 text-text-secondary">
                  {eq.manufacturerCompany.name}
                  <span className="text-text-quaternary"> · {eq.manufacturerCountry.name}</span>
                </td>
              )}
              {!compact && (
                <td className="px-4 py-2.5 text-text-secondary">{eq.airport.name}</td>
              )}
              {full && (
                <td className="px-4 py-2.5 text-text-secondary">
                  {eq.terminal?.name ?? "—"}
                  {eq.floor && <span className="text-text-quaternary"> · {eq.floor.name}</span>}
                  {eq.zone && <span className="text-text-quaternary"> · {eq.zone.name}</span>}
                </td>
              )}
              {full && <td className="px-4 py-2.5 text-text-secondary">{eq.operatedBy.name}</td>}
              <td className="px-4 py-2.5">
                <StatusBadge status={equipmentStatusConfig[eq.status]} />
              </td>
              {full && <td className="px-4 py-2.5 text-text-secondary">{eq.manufactureYear}</td>}
              {!compact && (
                <td className="px-4 py-2.5 text-text-secondary">
                  {formatDate(eq.nextInspectionAt)}
                </td>
              )}
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/equipment/${eq.id}`}
                    aria-label={t("common.view")}
                    className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                  >
                    <Icon name="eye" size={16} />
                  </Link>
                  <Link
                    href={`/equipment/${eq.id}/edit`}
                    aria-label={t("common.edit")}
                    className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                  >
                    <Icon name="edit" size={16} />
                  </Link>
                  {full && (
                    <button
                      aria-label={t("common.actions")}
                      className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                    >
                      <Icon name="dots-vertical" size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

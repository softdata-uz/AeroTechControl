"use client";

import Link from "next/link";
import type { Equipment } from "@/lib/types";
import { getEquipmentStatusConfig } from "@/config/equipmentStatus.config";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons";
import { airportName } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { useTranslations } from "@/lib/locale-context";

interface EquipmentTableProps {
  items: Equipment[];
  compact?: boolean;
}

export function EquipmentTable({ items, compact = false }: EquipmentTableProps) {
  const t = useTranslations();
  const equipmentStatusConfig = getEquipmentStatusConfig(t);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-primary text-left text-xs font-medium uppercase tracking-wide text-text-quaternary">
            <th className="px-4 py-2.5">{t("equipment.colId")}</th>
            <th className="px-4 py-2.5">{t("equipment.colEquipment")}</th>
            <th className="px-4 py-2.5">{t("equipment.colType")}</th>
            {!compact && <th className="px-4 py-2.5">{t("equipment.colAirport")}</th>}
            <th className="px-4 py-2.5">{t("equipment.colStatus")}</th>
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
              <td className="px-4 py-2.5 font-medium text-brand-400">{eq.code}</td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-text-primary">{eq.name}</p>
                <p className="text-xs text-text-tertiary">{eq.serialNumber}</p>
              </td>
              <td className="px-4 py-2.5 text-text-secondary">{eq.type}</td>
              {!compact && (
                <td className="px-4 py-2.5 text-text-secondary">{airportName(eq.airportId)}</td>
              )}
              <td className="px-4 py-2.5">
                <StatusBadge status={equipmentStatusConfig[eq.status]} />
              </td>
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
                  <button
                    aria-label={t("common.edit")}
                    className="rounded-md p-1.5 text-text-quaternary hover:bg-bg-quaternary hover:text-text-primary"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

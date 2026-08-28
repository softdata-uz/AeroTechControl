"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import type { ReportPeriod } from "@/services/reports.service";
import { useTranslations } from "@/lib/locale-context";

interface Props {
  value: ReportPeriod;
  onChange: (value: ReportPeriod) => void;
}

export function PeriodSelect({ value, onChange }: Props) {
  const t = useTranslations();
  const periodOptions = [
    { value: "30d", label: t("reports.periodOption30d") },
    { value: "90d", label: t("reports.periodOption90d") },
    { value: "year", label: t("reports.periodOptionYear") },
  ];

  return (
    <Dropdown
      className="w-44"
      value={value}
      onChange={(v) => onChange(v as ReportPeriod)}
      options={periodOptions}
    />
  );
}

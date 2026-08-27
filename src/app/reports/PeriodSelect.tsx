"use client";

import { Dropdown } from "@/components/ui/Dropdown";
import type { ReportPeriod } from "@/services/reports.service";

const PERIOD_OPTIONS = [
  { value: "30d", label: "Последние 30 дней" },
  { value: "90d", label: "Последние 90 дней" },
  { value: "year", label: "Год" },
];

interface Props {
  value: ReportPeriod;
  onChange: (value: ReportPeriod) => void;
}

export function PeriodSelect({ value, onChange }: Props) {
  return (
    <Dropdown
      className="w-44"
      value={value}
      onChange={(v) => onChange(v as ReportPeriod)}
      options={PERIOD_OPTIONS}
    />
  );
}

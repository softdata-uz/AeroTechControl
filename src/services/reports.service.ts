import { apiGet, apiDownload } from "./http-client";

export type ReportPeriod = "30d" | "90d" | "year";

export interface ComplianceMatrixCell {
  pct: number;
  count: number;
}

export interface ComplianceMatrixRow {
  airport: string;
  cells: (ComplianceMatrixCell | null)[]; // aligned index-for-index with `ComplianceMatrix.types`
}

export interface ComplianceMatrix {
  types: string[];
  rows: ComplianceMatrixRow[];
}

export interface ReportsSummary {
  total: number;
  operational: number;
  faulty: number;
  underRepair: number;
  overdueInspections: number;
  upcomingInspections: number;
  mttrHours: number;
  mttrSampleSize: number;
  mtbfHours: number;
  byTypeFaultCount: [string, number][];
  partsConsumption: [string, number][];
  complianceMatrix: ComplianceMatrix;
  dailyFaults: { date: string; value: number }[];
  radarSeries: { name: string; values: number[] }[];
}

// GET /reports/summary?period=30d
export function getReportsSummary(period: ReportPeriod = "30d"): Promise<ReportsSummary> {
  return apiGet<ReportsSummary>("/reports/summary", { period });
}

// GET /reports/summary/export?period=30d&format=xlsx
export function exportReportsSummary(period: ReportPeriod = "30d"): Promise<void> {
  return apiDownload("/reports/summary/export", { period, format: "xlsx" }, "reports-summary.xlsx");
}

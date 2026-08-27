"use client";

import { reportsService } from "@/services";
import type { ReportPeriod } from "@/services/reports.service";
import { useAsync } from "./useAsync";

export function useReportsSummary(period: ReportPeriod) {
  return useAsync(() => reportsService.getReportsSummary(period), [period]);
}

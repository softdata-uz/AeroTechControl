"use client";

import { faultIntelligenceService } from "@/services";
import { useAsync } from "./useAsync";

export function useHealthSummary(scope?: { airportId?: number }) {
  return useAsync(() => faultIntelligenceService.getHealthSummary(scope), [scope?.airportId]);
}

"use client";

import { faultIntelligenceService } from "@/services";
import { useAsync } from "./useAsync";

export function useHealthSummary(scope?: { airportId?: string }) {
  return useAsync(() => faultIntelligenceService.getHealthSummary(scope), [scope?.airportId]);
}

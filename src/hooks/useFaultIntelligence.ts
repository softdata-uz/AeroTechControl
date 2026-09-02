"use client";

import { faultIntelligenceService } from "@/services";
import type { FaultAnalyticsWindow, FaultIntelligenceScope } from "@/services/fault-intelligence.service";
import { useAsync } from "./useAsync";

export function useFaultIntelligence(window: FaultAnalyticsWindow = "30d", scope?: FaultIntelligenceScope) {
  return useAsync(
    () => faultIntelligenceService.getFaultIntelligenceSummary(window, scope),
    [window, scope?.airportId, scope?.terminalId]
  );
}

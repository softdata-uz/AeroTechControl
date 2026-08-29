"use client";

import { calibrationService } from "@/services";
import type { CalibrationFilters } from "@/services/calibration.service";
import { useAsync } from "./useAsync";

export function useCalibrationList(filters: CalibrationFilters) {
  return useAsync(() => calibrationService.listCalibrationRecords(filters), [JSON.stringify(filters)]);
}

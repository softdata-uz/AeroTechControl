"use client";

import { settingsService } from "@/services";
import { useAsync } from "./useAsync";

export function useDirectorySummary() {
  return useAsync(() => settingsService.getDirectorySummary(), []);
}

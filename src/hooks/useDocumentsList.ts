"use client";

import { documentsService } from "@/services";
import type { DocumentFilters } from "@/services/documents.service";
import { useAsync } from "./useAsync";

export function useDocumentsList(filters: DocumentFilters) {
  return useAsync(() => documentsService.listDocuments(filters), [JSON.stringify(filters)]);
}

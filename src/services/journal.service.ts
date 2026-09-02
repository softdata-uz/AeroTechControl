import { apiGetPage, type Page } from "./http-client";

export type JournalAction = "login_success" | "login_failed" | "login_blocked" | "create" | "delete";

export interface JournalEntry {
  id: number;
  userId: number | null;
  user: { id: number; fullName: string; login: string } | null;
  attemptedLogin: string | null;
  action: JournalAction;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface JournalFilters {
  userId?: number;
  action?: JournalAction;
  entityType?: string;
  page?: number;
  pageSize?: number;
}

// GET /journal (administrator/king only)
export function listJournal(filters: JournalFilters = {}): Promise<Page<JournalEntry>> {
  return apiGetPage<JournalEntry>("/journal", filters);
}

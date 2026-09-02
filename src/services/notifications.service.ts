import type { NotificationItem } from "@/lib/types";
import { apiGet, apiGetPage, apiPatch, type Page } from "./http-client";

export interface NotificationFilters {
  read?: boolean;
  severity?: NotificationItem["severity"];
  page?: number;
  pageSize?: number;
}

// GET /notifications
export function listNotifications(filters: NotificationFilters = {}): Promise<Page<NotificationItem>> {
  return apiGetPage<NotificationItem>("/notifications", filters);
}

// GET /notifications/unread-count
export function getUnreadCount(): Promise<number> {
  return apiGet<number>("/notifications/unread-count");
}

// PATCH /notifications/:id/read
export function markAsRead(id: number): Promise<NotificationItem> {
  return apiPatch<NotificationItem>(`/notifications/${id}/read`);
}

// PATCH /notifications/read-all
export function markAllAsRead(): Promise<void> {
  return apiPatch<void>("/notifications/read-all");
}

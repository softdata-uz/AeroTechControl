import type { NotificationItem } from "@/lib/types";
import { notifications as notificationSeed } from "@/lib/mock-data";
import { resolve, mutate, paginate, type Page } from "./http-client";

export interface NotificationFilters {
  read?: boolean;
  severity?: NotificationItem["severity"];
  page?: number;
  pageSize?: number;
}

// GET /notifications
export function listNotifications(filters: NotificationFilters = {}): Promise<Page<NotificationItem>> {
  return resolve(() => {
    let items = notificationSeed;
    if (filters.read !== undefined) items = items.filter((n) => n.read === filters.read);
    if (filters.severity) items = items.filter((n) => n.severity === filters.severity);
    return paginate(items, filters.page, filters.pageSize);
  });
}

// GET /notifications/unread-count
export function getUnreadCount(): Promise<number> {
  return resolve(() => notificationSeed.filter((n) => !n.read).length);
}

// PATCH /notifications/:id/read
export function markAsRead(id: string): Promise<NotificationItem> {
  return mutate(() => {
    const n = notificationSeed.find((n) => n.id === id);
    if (!n) throw new Error(`Notification ${id} not found`);
    n.read = true;
    return n;
  });
}

// PATCH /notifications/read-all
export function markAllAsRead(): Promise<void> {
  return mutate(() => {
    notificationSeed.forEach((n) => (n.read = true));
  });
}

"use client";

import { notificationsService } from "@/services";
import type { NotificationFilters } from "@/services/notifications.service";
import { useAsync } from "./useAsync";

export function useNotificationsList(filters: NotificationFilters) {
  return useAsync(() => notificationsService.listNotifications(filters), [JSON.stringify(filters)]);
}

// Settings page data: directory counts and notification preferences.
// Role simulation (auth.service) and theme (local-only UI preference) are
// intentionally not covered here — they are client-side concerns, not
// backend-backed resources.

import { airports, terminals, zones, equipment } from "@/lib/mock-data";
import { resolve, mutate } from "./http-client";

export interface DirectorySummary {
  airports: number;
  terminals: number;
  zones: number;
  equipmentTypes: number;
}

// GET /settings/directories/summary
export function getDirectorySummary(): Promise<DirectorySummary> {
  return resolve(() => ({
    airports: airports.length,
    terminals: terminals.length,
    zones: zones.length,
    equipmentTypes: new Set(equipment.map((e) => e.type)).size,
  }));
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

let notificationPreferences: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
};

// GET /settings/notification-preferences
export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return resolve(() => ({ ...notificationPreferences }));
}

// PATCH /settings/notification-preferences
export function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return mutate(() => {
    notificationPreferences = { ...notificationPreferences, ...patch };
    return { ...notificationPreferences };
  });
}

// Settings page data: directory counts and notification preferences.
// Role simulation (auth.service) and theme (local-only UI preference) are
// intentionally not covered here — they are client-side concerns, not
// backend-backed resources.

import { apiGet, apiPatch } from "./http-client";

export interface DirectorySummary {
  airports: number;
  terminals: number;
  zones: number;
  equipmentTypes: number;
}

// GET /settings/directories/summary
export function getDirectorySummary(): Promise<DirectorySummary> {
  return apiGet<DirectorySummary>("/settings/directories/summary");
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

// GET /settings/notification-preferences
export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>("/settings/notification-preferences");
}

// PATCH /settings/notification-preferences
export function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiPatch<NotificationPreferences>("/settings/notification-preferences", patch);
}

/**
 * Fixed categorical color order for generic (non-status) chart series —
 * "by type", "by airport", etc. Assigned by position, never cycled/
 * regenerated, per the dataviz skill's categorical-color rule. Status
 * charts (equipment/fault/inspection state) must keep using the domain
 * status configs instead — these five are for identity, not state.
 */
export const CHART_CATEGORICAL = [
  "var(--color-brand-500)",
  "var(--color-purple-500)",
  "var(--color-warning-500)",
  "var(--color-success-500)",
  "var(--color-error-400)",
  "var(--color-gray-400)",
] as const;

export function categoricalColor(index: number): string {
  return CHART_CATEGORICAL[index % CHART_CATEGORICAL.length];
}

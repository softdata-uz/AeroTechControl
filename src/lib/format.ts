export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return formatDate(value);
}

/** Russian comma-decimal hours, e.g. `formatHours(12.3)` -> "12,3 ч". */
export function formatHours(hours: number) {
  return `${(Math.round(hours * 10) / 10).toFixed(1).replace(".", ",")} ч`;
}

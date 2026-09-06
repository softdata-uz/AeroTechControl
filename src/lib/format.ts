export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString();
}

/** Russian comma-decimal hours, e.g. `formatHours(12.3)` -> "12,3 ч". */
export function formatHours(hours: number) {
  return `${(Math.round(hours * 10) / 10).toFixed(1).replace(".", ",")} ч`;
}

const API_ORIGIN = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  try {
    return new URL(apiUrl).origin;
  } catch {
    return null;
  }
})();

/**
 * The backend bakes its own host into `imageUrl` (e.g. `http://localhost:5000/uploads/x.jpg`)
 * via `PUBLIC_BASE_URL`, which won't match `NEXT_PUBLIC_API_URL` when the API is reached
 * through a different host/IP. Rewrite the origin so images follow wherever the frontend
 * is actually pointed, without needing the backend's env to match per deployment.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!API_ORIGIN) return url;
  try {
    const parsed = new URL(url);
    return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

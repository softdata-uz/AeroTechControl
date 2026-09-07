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
 * via `PUBLIC_BASE_URL`, which won't match wherever this frontend is actually served from.
 *
 * Dev: rewrite to NEXT_PUBLIC_API_URL's origin, reached directly (no proxy in this repo's
 * next.config.ts).
 * Production: strip to a relative path instead — the production Express server
 * (AeroTechProd/index.js) proxies /uploads to the real backend, so a relative path resolves
 * against this app's own origin and never triggers CORS or points at the wrong host.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production") {
      return `${parsed.pathname}${parsed.search}`;
    }
    return API_ORIGIN ? `${API_ORIGIN}${parsed.pathname}${parsed.search}` : url;
  } catch {
    return url;
  }
}

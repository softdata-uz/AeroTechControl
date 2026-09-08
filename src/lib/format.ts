const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Fixed `DD.MM.YYYY, HH:mm:ss` output, independent of runtime/browser locale.
 * Date-only values (Postgres `date` columns, e.g. `"2026-09-08"`, no "T") are
 * split directly rather than run through `Date` — parsing a bare date as
 * UTC-midnight and re-rendering in local time can roll the calendar day
 * backward/forward depending on the viewer's timezone offset. There's no
 * real time-of-day for these, so a fixed `00:00:00` is appended.
 */
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  if (!value.includes("T")) {
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}.${m}.${y}, 00:00:00`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const formatDateTime = formatDate;

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

/** Downloads a public static file (e.g. a resolved /uploads URL) as `filename` — no auth header needed. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

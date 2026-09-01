/** @format */

// Real HTTP transport for the AeroTech backend.
//
// Every service function in src/services/* returns a Promise shaped like a
// REST call and pagination is centralized through Page<T> — this file is
// the only place that knows about fetch(), the {success,snapdata,...}
// response envelope, and JWT refresh.

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const MAX_PAGE_SIZE = 200;

export interface ApiError {
  status: number;
  message: string;
}

export class ApiException extends Error implements ApiError {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiSuccessEnvelope<T> {
  success: true;
  snapdata: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

interface ApiErrorEnvelope {
  success: false;
  snapdata: null;
  message: string;
  error: string;
  statusCode: number;
  requestId?: string;
}

type QueryValue = string | number | boolean | undefined | null;

function clampPageSize(
  query: Record<string, QueryValue>,
): Record<string, QueryValue> {
  if (typeof query.pageSize === "number" && query.pageSize > MAX_PAGE_SIZE) {
    return { ...query, pageSize: MAX_PAGE_SIZE };
  }
  return query;
}

function buildQueryString(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const clamped = clampPageSize(query);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(clamped)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const body = (await res.json()) as ApiSuccessEnvelope<{
          accessToken: string;
          refreshToken: string;
        }>;
        const persisted =
          window.localStorage.getItem("atz-token-persist") === "1";
        setTokens(body.snapdata, persisted);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

function redirectToLogin(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  { isRetry = false }: { isRetry?: boolean } = {},
): Promise<T> {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (
    res.status === 401 &&
    !isRetry &&
    path !== "/auth/refresh" &&
    path !== "/auth/login"
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, init, { isRetry: true });
    }
    redirectToLogin();
    throw new ApiException(401, "Session expired");
  }

  if (res.status === 204) {
    if (!res.ok)
      throw new ApiException(res.status, res.statusText || "Request failed");
    return undefined as T;
  }

  let body: ApiSuccessEnvelope<T> | ApiErrorEnvelope | null = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (shouldn't happen for JSON endpoints).
  }

  if (!res.ok || !body || body.success === false) {
    const message = body && "message" in body ? body.message : res.statusText;
    throw new ApiException(res.status, message || "Request failed");
  }

  return body.snapdata;
}

export function apiGet<T>(path: string, query?: object): Promise<T> {
  return request<T>(
    `${path}${buildQueryString(query as Record<string, QueryValue> | undefined)}`,
    {
      method: "GET",
    },
  );
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  return request<T>(path, { method, body: formData });
}

export async function apiGetPage<T>(
  path: string,
  query?: object,
): Promise<Page<T>> {
  const queryTyped = query as Record<string, QueryValue> | undefined;
  const accessToken = getAccessToken();
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const doRequest = async (isRetry: boolean): Promise<Page<T>> => {
    const res = await fetch(
      `${API_BASE_URL}${path}${buildQueryString(queryTyped)}`,
      {
        method: "GET",
        headers,
      },
    );

    if (res.status === 401 && !isRetry) {
      const refreshed = await tryRefresh();
      if (refreshed) return doRequest(true);
      redirectToLogin();
      throw new ApiException(401, "Session expired");
    }

    const body = (await res.json()) as
      | ApiSuccessEnvelope<T[]>
      | ApiErrorEnvelope;
    if (!res.ok || body.success === false) {
      const message = "message" in body ? body.message : res.statusText;
      throw new ApiException(res.status, message || "Request failed");
    }

    const pagination = body.pagination ?? {
      page: 1,
      limit: body.snapdata.length,
      total: body.snapdata.length,
      totalPages: 1,
    };
    return {
      items: body.snapdata,
      page: pagination.page,
      pageSize: pagination.limit,
      total: pagination.total,
    };
  };

  return doRequest(false);
}

/** Client-side pagination helper — still used by derived views with no backend endpoint (e.g. calibration). */
export function paginate<T>(items: T[], page = 1, pageSize = 20): Page<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

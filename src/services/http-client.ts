// Thin mock transport standing in for a real HTTP client.
//
// Every service function in src/services/* is written as if it were calling
// a real NestJS backend: it returns a Promise, it can reject, and its shape
// mirrors what a REST endpoint would return. Today `resolve()` just delays
// and returns in-memory mock data. Swapping to a real backend later means
// replacing the body of `resolve`/`mutate` with `fetch(...)` calls — no
// change is needed in any calling hook or component.

const MOCK_LATENCY_MS = 250;

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

/** Simulates a GET — resolves with `data()` after a short network delay. */
export function resolve<T>(data: () => T, delayMs = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((res) => {
    setTimeout(() => res(data()), delayMs);
  });
}

/** Simulates a mutating call (POST/PATCH/DELETE) — same shape, named for clarity at call sites. */
export function mutate<T>(data: () => T, delayMs = MOCK_LATENCY_MS): Promise<T> {
  return resolve(data, delayMs);
}

/** Simulates a failed request, e.g. a 404 for an unknown id. */
export function reject(status: number, message: string, delayMs = MOCK_LATENCY_MS): Promise<never> {
  return new Promise((_res, rej) => {
    setTimeout(() => rej(new ApiException(status, message)), delayMs);
  });
}

export function paginate<T>(items: T[], page = 1, pageSize = 20): Page<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

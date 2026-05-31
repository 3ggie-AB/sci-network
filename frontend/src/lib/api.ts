// Lightweight API client for SCINetwork backend
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3434";

const TOKEN_KEY = "scinetwork.token";
const USER_KEY = "scinetwork.user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setStoredUser(user: unknown) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body = opts.body;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }

  const res = await fetch(`${BASE}${path}`, { ...opts, headers, body });
  const text = await res.text();
  const data = text ? safeJSON(text) : null;
  if (!res.ok) {
    const payload = isRecord(data) ? data : {};
    const msg = payload.message || payload.error || `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), data);
  }
  return data as T;
}

export function asArray<T = unknown>(response: unknown): T[] {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

export function asObject<T extends Record<string, unknown> = Record<string, unknown>>(
  response: unknown,
): Partial<T> {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (isRecord(candidate) && !Array.isArray(candidate)) return candidate as Partial<T>;
  }
  return {};
}

export function unwrapResponse<T = unknown>(response: unknown): T | null {
  const candidates = responseCandidates(response);
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== undefined) return candidate as T;
  }
  return null;
}

function responseCandidates(response: unknown): unknown[] {
  if (isRecord(response)) {
    const isEnvelope = "data" in response || "items" in response || "results" in response;
    if (!isEnvelope) return [response];

    const candidates: unknown[] = [];
    if ("data" in response) candidates.push(response.data);
    if ("items" in response) candidates.push(response.items);
    if ("results" in response) candidates.push(response.results);
    if (isRecord(response.data)) {
      candidates.push(response.data.data, response.data.items, response.data.results);
    }
    return candidates;
  }
  return [response];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${BASE}/health`, { signal: ctrl.signal }).catch(() => null);
    clearTimeout(t);
    if (res && res.ok) return true;
    // Fallback: try a known endpoint
    const res2 = await fetch(`${BASE}/api/network/scheduler/status`, {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
    }).catch(() => null);
    return !!res2 && res2.status < 500;
  } catch {
    return false;
  }
}

export const API_BASE_URL = BASE;

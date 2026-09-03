export function getApiBaseUrl(): string {
  // 1. If explicitly defined in environment and not pointing to localhost on production
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 2. Client-side runtime detection
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If accessed via Hostinger domains or production URL
    if (
      host.includes("hostingersite.com") ||
      host.includes("mediumseagreen-llama") ||
      host.includes("mintcream-walrus")
    ) {
      return "https://mintcream-walrus-725729.hostingersite.com/api/v1";
    }
  }

  // 3. Fallback for server-side or local dev
  return (process.env.NEXT_PUBLIC_API_URL || "https://mintcream-walrus-725729.hostingersite.com/api/v1").replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agency_token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token && token !== "demo-token") {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let payload: Record<string, unknown> = {};
    try {
      payload = await response.json();
    } catch {}
    throw new ApiError(
      String(payload.message ?? "تعذر تنفيذ الطلب"),
      response.status,
      payload.errors as Record<string, string[]> | undefined
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const isDemoMode = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname.includes("hostingersite.com")) return false;
  }
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};

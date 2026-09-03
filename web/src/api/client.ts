import { tokenStorage } from "@/auth/tokenStorage";
import type { ApiError } from "@/types/common";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.pathname + url.search;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStorage.get();
  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new ApiRequestError("Sesión expirada", 401);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const error = data as ApiError | undefined;
    throw new ApiRequestError(error?.message ?? "Error inesperado", response.status, error?.fieldErrors);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: RequestOptions["params"]) => apiRequest<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

/** Descarga un archivo (PDF/Excel) autenticado y dispara la descarga en el navegador. */
export async function downloadFile(path: string, params?: RequestOptions["params"]): Promise<void> {
  const token = tokenStorage.get();
  const response = await fetch(buildUrl(path, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new ApiRequestError("Sesión expirada", 401);
  }

  if (!response.ok) {
    throw new ApiRequestError("No se pudo descargar el archivo", response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? "descarga";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

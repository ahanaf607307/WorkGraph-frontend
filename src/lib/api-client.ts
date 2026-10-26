import { APP_CONFIG } from "../config";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}

class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${APP_CONFIG.apiUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem(APP_CONFIG.tokenKey);
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const currentOrgId = localStorage.getItem(APP_CONFIG.currentOrgKey);
    if (currentOrgId && !headers["x-organization-id"]) {
      headers["x-organization-id"] = currentOrgId;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let json: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      json?.message ||
      json?.error ||
      `Request failed with status code ${response.status}`;

    if (response.status === 401 && typeof window !== "undefined") {
      // If unauthorized and on protected route, clear token and redirect
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        localStorage.removeItem(APP_CONFIG.tokenKey);
        localStorage.removeItem(APP_CONFIG.userKey);
        window.location.href = "/login";
      }
    }

    throw new ApiError(errorMsg, response.status, json?.data);
  }

  // Backend standard structure: { success, statusCode, message, data, meta }
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }

  return (json || {}) as T;
}

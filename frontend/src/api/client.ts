// Fetch wrapper that:
// - sends cookies (credentials: "include")
// - parses the { data, error } envelope
// - throws with Arabic error messages on non-2xx responses

export interface ApiError {
  code?: string;
  message: string;
  status: number;
}

export class ApiRequestError extends Error implements ApiError {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, credentials: "include", headers };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiRequestError("استجابة غير صالحة من الخادم", response.status);
  }

  if (!response.ok) {
    const err = (json as { detail?: string; error?: { code?: string; message?: string } }) ?? {};
    const message = err.error?.message ?? err.detail ?? "حدث خطأ غير متوقع";
    throw new ApiRequestError(message, response.status, err.error?.code);
  }

  return ((json as { data: T }).data ?? (json as T));
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

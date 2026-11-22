// Thin fetch wrapper: JSON in/out, throws ApiError on non-2xx responses.
export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.status = status;
    this.details = details; // field -> message, from backend validation
  }
}

// `keepalive` lets the request finish after the page is closed or refreshed.
export async function request(path, { method = 'GET', body, keepalive } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    keepalive,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  }
  return data;
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const details = Array.isArray(data?.details)
      ? data.details
          .map((d: { path?: string; message?: string; title?: string }) => d.message ?? d.title)
          .filter(Boolean)
          .join("; ")
      : "";
    throw new Error([data?.error ?? `Request failed (${res.status})`, details].filter(Boolean).join(": "));
  }
  return data as T;
}

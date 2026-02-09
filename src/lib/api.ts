const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not defined. Set it in .env.local or your deployment environment.",
  );
}

export async function apiFetch<T = unknown>(
  path: string,
  getAccessToken: () => Promise<string | null>,
  options?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    if (process.env.NODE_ENV === "development") {
      console.error(`API error: ${res.status} ${res.statusText}`, body);
    }
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

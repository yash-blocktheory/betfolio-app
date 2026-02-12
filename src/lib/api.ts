function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not defined. Set it in .env.local or your deployment environment.",
    );
  }
  return url;
}

export async function apiFetch<T = unknown>(
  path: string,
  getAccessToken: () => Promise<string | null>,
  options?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();
  const apiUrl = getApiUrl();

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`API error: ${res.status} ${res.statusText}`, body);
    let detail = "";
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message || parsed.error || body;
    } catch {
      detail = body;
    }
    throw new Error(detail || `API error: ${res.status}`);
  }

  return res.json();
}

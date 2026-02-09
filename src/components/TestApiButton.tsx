"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { apiFetch } from "@/lib/api";

export default function TestApiButton() {
  const { getAccessToken } = usePrivy();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    setResult(null);
    setError(null);
    try {
      const data = await apiFetch("/auth/me", getAccessToken);
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleTest}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-80"
      >
        Test Backend
      </button>
      {result && (
        <pre className="max-w-sm overflow-auto rounded bg-zinc-100 p-3 text-left text-xs dark:bg-zinc-800">
          {result}
        </pre>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import SkeletonCard from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";
import { Contest, Bet, PaginatedResponse } from "@/types/contest";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ONE_MINUTE", label: "1 Min" },
  { key: "FIFTEEN_MINUTES", label: "15 Min" },
  { key: "ONE_HOUR", label: "1 Hour" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function ContestsPage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [contests, setContests] = useState<Contest[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const fetchData = useCallback(async () => {
    const [contestRes, betRes] = await Promise.all([
      apiFetch<PaginatedResponse<Contest>>("/contests?limit=100", getAccessToken),
      apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken),
    ]);
    setContests(contestRes.data);
    setBets(betRes.data);
  }, [getAccessToken]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    setLoading(true);
    fetchData()
      .catch(console.error)
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchData().catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [ready, authenticated, fetchData]);

  const bettedContestIds = new Set(bets.map((b) => b.contestId));
  const available = contests
    .filter((c) => !bettedContestIds.has(c.id) && (c.status === "UPCOMING" || c.status === "OPEN"))
    .filter((c) => filter === "ALL" || c.contestCategory === filter)
    .sort((a, b) => (a.status === "OPEN" ? -1 : 1) - (b.status === "OPEN" ? -1 : 1));

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">Please log in to view contests.</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Contests</h1>

      {/* Filter Chips */}
      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-foreground text-background"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : available.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          No contests available{filter !== "ALL" ? " for this category" : ""}.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {available.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}

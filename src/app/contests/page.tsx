"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import SkeletonCard from "@/components/SkeletonCard";
import { apiFetch } from "@/lib/api";
import { Contest, PaginatedResponse } from "@/types/contest";

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const fetchData = useCallback(async () => {
    const contestRes = await apiFetch<PaginatedResponse<Contest>>("/contests?limit=100", getAccessToken);
    setContests(contestRes.data);
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

  const available = contests
    .filter((c) => c.status === "UPCOMING" || c.status === "ACTIVE")
    .filter((c) => filter === "ALL" || c.contestCategory === filter)
    .sort((a, b) => (a.status === "ACTIVE" ? -1 : 1) - (b.status === "ACTIVE" ? -1 : 1));

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <img src="/red-ring-full.png" alt="" className="h-16 w-16 object-contain opacity-60" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Login to enter the arena</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-8 font-serif text-2xl font-bold tracking-[0.08em] text-white">All Arenas</h1>

      {/* Filter Chips */}
      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-[10px] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${
              filter === f.key
                ? "border border-red-600/30 bg-red-600/10 text-red-400"
                : "border border-white/[0.06] bg-white/[0.02] text-wolf-gray-500 hover:border-white/[0.15] hover:text-wolf-gray-300"
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
        <div className="flex flex-col items-center gap-3 py-16">
          <img src="/red-ring-full.png" alt="" className="h-10 w-10 object-contain opacity-20" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">
            No arenas available{filter !== "ALL" ? " for this category" : ""}
          </p>
        </div>
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import BetCard from "@/components/BetCard";
import SkeletonCard from "@/components/SkeletonCard";
import StatBlock from "@/components/arena/StatBlock";
import { apiFetch } from "@/lib/api";
import { Contest, Bet, LeaderboardEntry, PaginatedResponse } from "@/types/contest";

type Tab = "active" | "contests" | "completed";

export default function Home() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const [contests, setContests] = useState<Contest[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [payouts, setPayouts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("contests");

  useEffect(() => {
    if (ready && authenticated) {
      apiFetch("/auth/me", getAccessToken).catch(console.error);
    }
  }, [ready, authenticated, getAccessToken]);

  const fetchData = useCallback(async () => {
    const [, fetchedBets] = await Promise.all([
      apiFetch<PaginatedResponse<Contest>>("/contests?limit=100", getAccessToken).then((r) => setContests(r.data)).catch(() => setContests([])),
      apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken).then((r) => { setBets(r.data); return r.data; }).catch(() => { setBets([]); return [] as Bet[]; }),
    ]);

    const wallet = user?.wallet?.address?.toLowerCase();
    if (!wallet) return;

    const paidBets = fetchedBets.filter((b) => b.round.contest.status === "PAID");
    if (paidBets.length === 0) return;

    const payoutMap: Record<string, number> = {};
    const contestIds = [...new Set(paidBets.map((b) => b.round.contest.id))];
    await Promise.all(
      contestIds.map((contestId) =>
        apiFetch<PaginatedResponse<LeaderboardEntry>>(
          `/contests/${contestId}/leaderboard?limit=100`,
          getAccessToken,
        )
          .then((res) => {
            const me = res.data.find(
              (e) => e.user.walletAddress?.toLowerCase() === wallet,
            );
            if (me?.payout && me.payout > 0) {
              payoutMap[contestId] = me.payout;
            }
          })
          .catch(() => {}),
      ),
    );
    setPayouts(payoutMap);
  }, [getAccessToken, user?.wallet?.address]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    setLoading(true);
    setError(null);
    fetchData()
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchData().catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [ready, authenticated, fetchData]);

  const activeBets = bets.filter((b) => b.round.contest.status !== "PAID");
  const availableContests = contests
    .filter((c) => c.status === "UPCOMING" || c.status === "ACTIVE")
    .sort((a, b) => (a.status === "ACTIVE" ? -1 : 1) - (b.status === "ACTIVE" ? -1 : 1));
  const bettedContestIds = new Set(bets.map((b) => b.round.contest.id));
  const completedContests = contests
    .filter((c) => (c.status === "PAID" || c.status === "RESOLVED") && bettedContestIds.has(c.id))
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  const totalWinnings = Object.values(payouts).reduce((sum, v) => sum + v, 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "contests", label: "Arenas", count: availableContests.length },
    { key: "active", label: "Active", count: activeBets.length },
    { key: "completed", label: "History", count: completedContests.length },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em]">
            <span
              style={{
                background: "linear-gradient(180deg, #fff, #d4d4d4 30%, #a0a0a0 60%, #737373)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 40px rgba(220, 38, 38, 0.08))",
              }}
            >
              Clash of W
            </span>
            <span className="inline-flex items-end justify-center shrink-0" style={{ width: "1em", height: "0.8em" }}>
              <img src="/red-ring-full.png" alt="O" className="h-[0.8em] w-auto max-w-[1em] object-contain object-bottom bg-black rounded-full" />
            </span>
            <span
              style={{
                background: "linear-gradient(180deg, #fff, #d4d4d4 30%, #a0a0a0 60%, #737373)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 40px rgba(220, 38, 38, 0.08))",
              }}
            >
              lves
            </span>
          </h1>
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-wolf-gray-500">The Arena</p>
        </div>
        <LoginButton />
      </header>

      {ready && !authenticated && (
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          <h2
            className="font-serif text-2xl sm:text-4xl font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]"
            style={{
              background: "linear-gradient(180deg, #fff, #d4d4d4 30%, #a0a0a0 60%, #737373)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 40px rgba(220, 38, 38, 0.08))",
            }}
          >
            Predict. Compete. Win.
          </h2>
          <p className="max-w-sm text-sm font-medium text-wolf-gray-500">
            Enter the crypto prediction arena. Compete against other players in real-time rounds. Claim your HYPE.
          </p>
          <LoginButton />
        </div>
      )}

      {authenticated && loading && (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {authenticated && error && (
        <p className="text-center text-sm font-semibold text-red-400">Unable to load data. Please refresh.</p>
      )}

      {authenticated && !loading && !error && (
        <div className="flex flex-col gap-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBlock label="Active Bets" value={activeBets.length} />
            <StatBlock label="Completed" value={completedContests.length} />
            <StatBlock label="HYPE Won" value={totalWinnings > 0 ? totalWinnings.toFixed(2) : "0"} accent />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
                  tab === t.key
                    ? "text-white"
                    : "text-wolf-gray-600 hover:text-wolf-gray-400"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[12px] ${
                    tab === t.key
                      ? "bg-red-600/20 text-red-400"
                      : "bg-white/[0.05] text-wolf-gray-500"
                  }`}>
                    {t.count}
                  </span>
                )}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-wolf-red" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "contests" && (
            availableContests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <img src="/red-ring-full.png" alt="" className="h-10 w-10 object-contain opacity-20" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">No arenas available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {availableContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} />
                ))}
              </div>
            )
          )}

          {tab === "active" && (
            activeBets.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <img src="/red-ring-full.png" alt="" className="h-10 w-10 object-contain opacity-20" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">No active bets</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            )
          )}

          {tab === "completed" && (
            completedContests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <img src="/red-ring-full.png" alt="" className="h-10 w-10 object-contain opacity-20" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">No completed contests</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import BetCard from "@/components/BetCard";
import SkeletonCard from "@/components/SkeletonCard";
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
      apiFetch<PaginatedResponse<Contest>>("/contests?limit=100", getAccessToken).then((r) => setContests(r.data)),
      apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken).then((r) => { setBets(r.data); return r.data; }).catch(() => { setBets([]); return [] as Bet[]; }),
    ]);

    const wallet = user?.wallet?.address?.toLowerCase();
    if (!wallet) return;

    const paidBets = fetchedBets.filter((b) => b.contest.status === "PAID");
    if (paidBets.length === 0) return;

    const payoutMap: Record<string, number> = {};
    await Promise.all(
      paidBets.map((bet) =>
        apiFetch<PaginatedResponse<LeaderboardEntry>>(
          `/contests/${bet.contestId}/leaderboard?limit=100`,
          getAccessToken,
        )
          .then((res) => {
            const me = res.data.find(
              (e) => e.user.walletAddress?.toLowerCase() === wallet,
            );
            if (me?.payout && me.payout > 0) {
              payoutMap[bet.contestId] = me.payout;
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

  const activeBets = bets.filter((b) => b.contest.status !== "PAID");
  const completedBets = bets.filter((b) => b.contest.status === "PAID");
  const bettedContestIds = new Set(bets.map((b) => b.contestId));
  const availableContests = contests
    .filter((c) => !bettedContestIds.has(c.id) && (c.status === "UPCOMING" || c.status === "OPEN"))
    .sort((a, b) => (a.status === "OPEN" ? -1 : 1) - (b.status === "OPEN" ? -1 : 1));

  const totalWinnings = Object.values(payouts).reduce((sum, v) => sum + v, 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "contests", label: "Contests", count: availableContests.length },
    { key: "active", label: "Active", count: activeBets.length },
    { key: "completed", label: "Completed", count: completedBets.length },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Betfolio</h1>
        <LoginButton />
      </header>

      {ready && !authenticated && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <h2 className="text-3xl font-bold">Predict. Compete. Win.</h2>
          <p className="max-w-sm text-zinc-500">
            Join crypto prediction contests, compete against other players, and win HYPE rewards.
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
        <p className="text-center text-sm text-red-500">Unable to load data. Please refresh.</p>
      )}

      {authenticated && !loading && !error && (
        <div className="flex flex-col gap-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-2xl font-bold">{activeBets.length}</p>
              <p className="text-xs text-zinc-500">Active Bets</p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-2xl font-bold">{completedBets.length}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3 text-center dark:border-zinc-700">
              <p className="text-2xl font-bold">{totalWinnings > 0 ? totalWinnings.toFixed(2) : "0"}</p>
              <p className="text-xs text-zinc-500">HYPE Won</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "text-foreground"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                    tab === t.key
                      ? "bg-foreground text-background"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}>
                    {t.count}
                  </span>
                )}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "contests" && (
            availableContests.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No contests available</p>
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
              <p className="py-8 text-center text-sm text-zinc-500">No active bets</p>
            ) : (
              <div className="flex flex-col gap-3">
                {activeBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            )
          )}

          {tab === "completed" && (
            completedBets.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No completed bets</p>
            ) : (
              <div className="flex flex-col gap-3">
                {completedBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} payoutAmount={payouts[bet.contestId]} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

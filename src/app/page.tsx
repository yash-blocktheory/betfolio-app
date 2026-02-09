"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import BetCard from "@/components/BetCard";
import { apiFetch } from "@/lib/api";
import { Contest, Bet, LeaderboardEntry } from "@/types/contest";


const POLL_INTERVAL = 5000;

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
      apiFetch<Contest[]>("/contests", getAccessToken).then(setContests),
      apiFetch<Bet[]>("/bets/me", getAccessToken).then((b) => { setBets(b); return b; }),
    ]);

    const wallet = user?.wallet?.address?.toLowerCase();
    if (!wallet) return;

    const paidBets = fetchedBets.filter((b) => b.contest.status === "PAID");
    if (paidBets.length === 0) return;

    const payoutMap: Record<string, number> = {};
    await Promise.all(
      paidBets.map((bet) =>
        apiFetch<LeaderboardEntry[]>(
          `/contests/${bet.contestId}/leaderboard`,
          getAccessToken,
        )
          .then((entries) => {
            const me = entries.find(
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
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ready, authenticated, fetchData]);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Betfolio</h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          Contest Betting Platform
        </p>
      </header>

      <div className="flex flex-col items-center gap-6">
        <LoginButton />

        {ready && !authenticated && (
          <p className="text-sm text-zinc-500">Log in to view contests</p>
        )}

        {authenticated && (() => {
          const activeBets = bets.filter((b) => b.contest.status !== "PAID");
          const completedBets = bets.filter((b) => b.contest.status === "PAID");
          const bettedContestIds = new Set(bets.map((b) => b.contestId));
          const available = contests
            .filter((c) => !bettedContestIds.has(c.id) && (c.status === "UPCOMING" || c.status === "OPEN"))
            .sort((a, b) => (a.status === "OPEN" ? -1 : 1) - (b.status === "OPEN" ? -1 : 1));

          const tabs: { key: Tab; label: string; count: number }[] = [
            { key: "contests", label: "Contests", count: available.length },
            { key: "active", label: "Active", count: activeBets.length },
            { key: "completed", label: "Completed", count: completedBets.length },
          ];

          return (
            <div className="w-full">
              <div className="mb-6 flex border-b border-zinc-200 dark:border-zinc-700">
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

              {loading && <p className="text-center text-sm text-zinc-500">Loading...</p>}
              {error && <p className="text-center text-sm text-red-500">Unable to load data. Please refresh.</p>}

              {!loading && !error && tab === "contests" && (
                available.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500">No contests available</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {available.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} />
                    ))}
                  </div>
                )
              )}

              {!loading && !error && tab === "active" && (
                activeBets.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500">No active bets</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {activeBets.map((bet) => (
                      <BetCard key={bet.id} bet={bet} />
                    ))}
                  </div>
                )
              )}

              {!loading && !error && tab === "completed" && (
                completedBets.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500">No completed bets</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {completedBets.map((bet) => (
                      <BetCard key={bet.id} bet={bet} payoutAmount={payouts[bet.contestId]} />
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

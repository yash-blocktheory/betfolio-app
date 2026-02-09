"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import ContestCard from "@/components/ContestCard";
import BetCard from "@/components/BetCard";
import { apiFetch } from "@/lib/api";
import { Contest, Bet, LeaderboardEntry } from "@/types/contest";

const POLL_INTERVAL = 5000;

export default function Home() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const [contests, setContests] = useState<Contest[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [payouts, setPayouts] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const participantMap: Record<string, number> = {};
    await Promise.all(
      paidBets.map((bet) =>
        apiFetch<LeaderboardEntry[]>(
          `/contests/${bet.contestId}/leaderboard`,
          getAccessToken,
        )
          .then((entries) => {
            if (entries.length > 0) {
              participantMap[bet.contestId] = entries.length;
            }
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
    setParticipants(participantMap);
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

        {authenticated && (
          <div className="w-full">
            {loading && <p className="text-center text-sm text-zinc-500">Loading contests...</p>}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500">Unable to load data. Please refresh.</p>
              </div>
            )}

            {!loading && !error && (() => {
              const activeBets = bets.filter((b) => b.contest.status !== "RESOLVED" && b.contest.status !== "PAID");
              const completedBets = bets.filter((b) => b.contest.status === "PAID");
              return (
                <>
                  {activeBets.length > 0 && (
                    <section className="mb-8">
                      <h2 className="mb-4 text-lg font-semibold">Your Active Bets</h2>
                      <div className="flex flex-col gap-4">
                        {activeBets.map((bet) => (
                          <BetCard key={bet.id} bet={bet} />
                        ))}
                      </div>
                    </section>
                  )}
                  {completedBets.length > 0 && (
                    <section className="mb-8">
                      <h2 className="mb-4 text-lg font-semibold">Your Completed Bets</h2>
                      <div className="flex flex-col gap-4">
                        {completedBets.map((bet) => (
                          <BetCard key={bet.id} bet={bet} payoutAmount={payouts[bet.contestId]} participantCount={participants[bet.contestId]} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              );
            })()}

            {!loading && !error && (() => {
              const bettedContestIds = new Set(bets.map((b) => b.contestId));
              const available = contests.filter((c) => !bettedContestIds.has(c.id) && (c.status === "UPCOMING" || c.status === "OPEN"));
              return (
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Contests</h2>
                  {available.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">No contests available</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {available.map((contest) => (
                        <ContestCard key={contest.id} contest={contest} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

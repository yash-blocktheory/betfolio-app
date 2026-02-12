"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ContestDetail, LeaderboardEntry, Bet, PaginatedResponse } from "@/types/contest";
import LoginButton from "@/components/LoginButton";
import MarketRow from "@/components/MarketRow";
import Leaderboard from "@/components/Leaderboard";

const POLL_INTERVAL = 3000;

type Picks = Record<string, "YES" | "NO">;

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const [data, setData] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<Picks>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<"idle" | "pending" | "confirmed" | "refunded" | "timeout">("idle");
  const [pendingBetId, setPendingBetId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [existingBet, setExistingBet] = useState<Bet | null>(null);
  const [betCheckDone, setBetCheckDone] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const fetchContest = useCallback(() => {
    return apiFetch<ContestDetail>(`/contests/${id}`, getAccessToken)
      .then(setData)
      .catch(() => setError("Failed to load contest"));
  }, [id, getAccessToken]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    setLoading(true);
    setError(null);
    fetchContest().then(() => setLoading(false));
  }, [ready, authenticated, fetchContest]);

  // Check if user already placed a bet on this contest
  useEffect(() => {
    if (!ready || !authenticated) return;

    apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken)
      .then((res) => {
        const found = res.data.find((b) => b.contestId === id);
        if (found) setExistingBet(found);
      })
      .catch(() => {})
      .finally(() => setBetCheckDone(true));
  }, [ready, authenticated, id, getAccessToken]);

  // Only poll odds for non-resolved contests
  useEffect(() => {
    if (!ready || !authenticated || !data) return;
    if (data.contest.status === "RESOLVED" || data.contest.status === "PAID") return;

    const interval = setInterval(fetchContest, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ready, authenticated, data, fetchContest]);

  // Fetch leaderboard once for resolved/paid contests
  useEffect(() => {
    if (!ready || !authenticated || !data) return;
    if (data.contest.status !== "RESOLVED" && data.contest.status !== "PAID") return;

    setLbLoading(true);
    apiFetch<PaginatedResponse<LeaderboardEntry>>(`/contests/${id}/leaderboard?limit=100`, getAccessToken)
      .then((res) => setLeaderboard(res.data))
      .catch(() => setLeaderboard([]))
      .finally(() => setLbLoading(false));
  }, [ready, authenticated, data, id, getAccessToken]);

  const [timeToStart, setTimeToStart] = useState<number | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!data || data.contest.status === "RESOLVED" || data.contest.status === "PAID") return;

    function tick() {
      const now = Date.now();
      const start = new Date(data!.contest.startTime).getTime();
      const end = new Date(data!.contest.endTime).getTime();

      if (now < start) {
        setTimeToStart(Math.max(0, start - now));
        setTimeLeft(end - start);
      } else {
        setTimeToStart(null);
        setTimeLeft(Math.max(0, end - now));
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data]);

  // Fetch live prices from Hyperliquid
  useEffect(() => {
    if (!data) return;
    const contest = data.contest;
    if (contest.status === "RESOLVED" || contest.status === "PAID") return;

    const assets = [...new Set(data.markets.map((m) => m.asset))];

    function fetchPrices() {
      fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "allMids" }),
      })
        .then((r) => r.json())
        .then((mids: Record<string, string>) => {
          const prices: Record<string, number> = {};
          for (const asset of assets) {
            if (mids[asset]) {
              prices[asset] = parseFloat(mids[asset]);
            }
          }
          setLivePrices(prices);
        })
        .catch(() => {});
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [data]);

  const isUpcoming = timeToStart !== null && timeToStart > 0;
  const isClosed = !isUpcoming && timeLeft !== null && timeLeft <= 0;

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function handleSelect(marketId: string, choice: "YES" | "NO") {
    setPicks((prev) => ({ ...prev, [marketId]: choice }));
    setSubmitMsg(null);
  }

  async function handleSubmit() {
    if (!data) return;

    const allPicked = data.markets.every((m) => picks[m.id]);
    if (!allPicked) {
      setSubmitMsg("Please select all markets");
      return;
    }

    setSubmitting(true);
    setSubmitMsg(null);
    setDepositStatus("idle");

    try {
      const bet = await apiFetch<Bet>("/bets", getAccessToken, {
        method: "POST",
        body: JSON.stringify({
          contestId: id,
          picks: data.markets.map((m) => ({
            marketId: m.id,
            choice: picks[m.id],
          })),
        }),
      });

      setPendingBetId(bet.id);
      setDepositStatus("pending");
      setSubmitMsg(null);
      setSubmitting(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setSubmitMsg(errMsg);
      setSubmitting(false);
    }
  }

  // Poll for deposit confirmation after bet is placed
  useEffect(() => {
    if (depositStatus !== "pending" || !pendingBetId) return;

    const startTime = Date.now();
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=10", getAccessToken);
        const bet = res.data.find((b) => b.id === pendingBetId);
        if (!bet) return;

        if (bet.depositStatus === "CONFIRMED") {
          setDepositStatus("confirmed");
          setExistingBet(bet);
          clearInterval(interval);
        } else if (bet.depositStatus === "REFUNDED") {
          setDepositStatus("refunded");
          clearInterval(interval);
        } else if (Date.now() - startTime > 60000) {
          setDepositStatus("timeout");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [depositStatus, pendingBetId, getAccessToken]);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">Please log in to view this contest.</p>
        <LoginButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading contest...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">Unable to load contest. Please refresh.</p>
      </div>
    );
  }

  const { contest, markets } = data;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        &larr; Back to contests
      </Link>

      <header className="mt-6 mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {contest.name || contest.contestCategory || "Contest"}
          </h1>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800">
            {contest.status}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Entry Fee: {contest.entryFee}</p>
          <p>Starts: {new Date(contest.startTime).toLocaleString()}</p>
          <p>Ends: {new Date(contest.endTime).toLocaleString()}</p>
          {contest.participantCount !== undefined && contest.participantCount > 0 && (
            <p>Players: {contest.participantCount}</p>
          )}
        </div>
        {contest.status !== "RESOLVED" && contest.status !== "PAID" && (
          <div className="mt-4">
            {isClosed ? (
              <p className="text-sm font-medium text-red-500">Contest closed</p>
            ) : isUpcoming ? (
              <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                Starts in: {formatTime(timeToStart!)}
              </p>
            ) : timeLeft !== null ? (
              <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                Time remaining: {formatTime(timeLeft)}
              </p>
            ) : null}
          </div>
        )}
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Markets</h2>
        {markets.length === 0 ? (
          <p className="text-sm text-zinc-500">No markets available</p>
        ) : (
          <div className="flex flex-col gap-3">
            {markets.map((market) => (
              <MarketRow
                key={market.id}
                market={market}
                selectedChoice={picks[market.id]}
                onSelect={handleSelect}
                disabled={isClosed || isUpcoming || !!existingBet}
                livePrice={livePrices[market.asset]}
              />
            ))}
          </div>
        )}
      </section>

      {existingBet && (
        <div className="mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Your picks for this contest:</p>
          <div className="flex flex-col gap-2">
            {existingBet.picks.map((pick) => (
              <div key={pick.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{pick.market.asset}</span>
                <span className={`rounded px-2 py-0.5 font-mono text-xs ${
                  pick.choice === "YES"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {pick.choice} @ {parseFloat(String(pick.entryOdds)).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {betCheckDone && !existingBet && markets.length > 0 && contest.status !== "RESOLVED" && contest.status !== "PAID" && !isClosed && !isUpcoming && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {depositStatus === "idle" && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition-colors hover:opacity-80 disabled:opacity-50"
            >
              {submitting ? "Placing bet..." : `Submit Bet (${data.contest.entryFee} HYPE)`}
            </button>
          )}

          {depositStatus === "pending" && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Bet placed! Confirming deposit...
              </span>
            </div>
          )}

          {depositStatus === "confirmed" && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Bet confirmed!
              </span>
            </div>
          )}

          {depositStatus === "refunded" && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Deposit failed. No funds charged.
                </span>
              </div>
              <button
                onClick={() => { setDepositStatus("idle"); setPendingBetId(null); }}
                className="text-sm text-zinc-500 underline hover:text-zinc-700"
              >
                Try again
              </button>
            </div>
          )}

          {depositStatus === "timeout" && (
            <div className="rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Deposit in progress. Check back shortly.
              </span>
            </div>
          )}

          {submitMsg && (
            <p className={`text-sm ${submitMsg.includes("failed") || submitMsg.includes("Failed") || submitMsg.includes("cancelled") ? "text-red-500" : "text-zinc-600 dark:text-zinc-400"}`}>
              {submitMsg}
            </p>
          )}
        </div>
      )}

      {(contest.status === "RESOLVED" || contest.status === "PAID") && (
        <section className="mt-8">
          <Leaderboard
            entries={leaderboard}
            loading={lbLoading}
            showPayout={contest.status === "PAID"}
            currentUserWallet={user?.wallet?.address}
          />
        </section>
      )}
    </div>
  );
}

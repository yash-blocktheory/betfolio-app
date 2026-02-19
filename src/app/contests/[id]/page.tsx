"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ContestDetail, Round, LeaderboardEntry, Bet, PaginatedResponse } from "@/types/contest";
import LoginButton from "@/components/LoginButton";
import MarketRow from "@/components/MarketRow";
import Leaderboard from "@/components/Leaderboard";
import ArenaCard from "@/components/arena/ArenaCard";
import StatBlock from "@/components/arena/StatBlock";
import CountdownTimer from "@/components/arena/CountdownTimer";
import GlowButton from "@/components/arena/GlowButton";
import RingSpinner from "@/components/arena/RingSpinner";

const POLL_INTERVAL = 3000;

type Picks = Record<string, "YES" | "NO">;

const roundStatusStyles: Record<string, string> = {
  OPEN: "bg-red-600/10 text-red-400 border border-red-600/20",
  UPCOMING: "bg-white/[0.03] text-wolf-gray-500 border border-white/[0.06]",
  LOCKED: "bg-wolf-amber/10 text-wolf-amber-light border border-wolf-amber/20",
  RESOLVED: "bg-wolf-amber/10 text-wolf-amber-light border border-wolf-amber/20",
};

export default function ContestDetailPage() {
  const { id } = useParams<{ id: string }>();
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
  const [userBets, setUserBets] = useState<Map<string, Bet>>(new Map());
  const [betCheckDone, setBetCheckDone] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  const fetchContest = useCallback(() => {
    return apiFetch<ContestDetail>(`/contests/${id}`, getAccessToken)
      .then(setData)
      .catch(() => setError("Failed to load contest"));
  }, [id, getAccessToken]);

  const fetchUserBets = useCallback(() => {
    return apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken)
      .then((res) => {
        const betsForContest = res.data.filter((b) => b.round.contest.id === id);
        const map = new Map<string, Bet>();
        betsForContest.forEach((b) => map.set(b.roundId, b));
        setUserBets(map);
      })
      .catch(() => {})
      .finally(() => setBetCheckDone(true));
  }, [id, getAccessToken]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchContest(), fetchUserBets()]).then(() => setLoading(false));
  }, [ready, authenticated, fetchContest, fetchUserBets]);

  useEffect(() => {
    if (!ready || !authenticated || !data) return;
    if (data.contest.status === "RESOLVED" || data.contest.status === "PAID") return;
    const interval = setInterval(() => {
      fetchContest();
      fetchUserBets();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [ready, authenticated, data, fetchContest, fetchUserBets]);

  useEffect(() => {
    if (!ready || !authenticated || !data) return;

    function fetchLeaderboard() {
      return apiFetch<PaginatedResponse<LeaderboardEntry>>(`/contests/${id}/leaderboard?limit=100`, getAccessToken)
        .then((res) => setLeaderboard(res.data))
        .catch(() => setLeaderboard([]));
    }

    setLbLoading(true);
    fetchLeaderboard().finally(() => setLbLoading(false));

    const isLive = data.contest.status === "ACTIVE" || data.contest.status === "SETTLING";
    if (isLive) {
      const interval = setInterval(fetchLeaderboard, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [ready, authenticated, data, id, getAccessToken]);

  useEffect(() => {
    if (!data) return;
    if (data.contest.status === "RESOLVED" || data.contest.status === "PAID") return;
    const allMarkets = data.rounds.flatMap((r) => r.markets);
    const assets = [...new Set(allMarkets.map((m) => m.asset))];
    if (assets.length === 0) return;

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
            if (mids[asset]) prices[asset] = parseFloat(mids[asset]);
          }
          setLivePrices(prices);
        })
        .catch(() => {});
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [data]);

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
          setUserBets((prev) => new Map(prev).set(bet.roundId, bet));
          clearInterval(interval);
        } else if (bet.depositStatus === "REFUNDED") {
          setDepositStatus("refunded");
          clearInterval(interval);
        } else if (Date.now() - startTime > 60000) {
          setDepositStatus("timeout");
          clearInterval(interval);
        }
      } catch { /* keep polling */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [depositStatus, pendingBetId, getAccessToken]);

  function handleSelect(marketId: string, choice: "YES" | "NO") {
    setPicks((prev) => ({ ...prev, [marketId]: choice }));
    setSubmitMsg(null);
  }

  async function handleSubmit(round: Round) {
    const allPicked = round.markets.every((m) => picks[m.id]);
    if (!allPicked) {
      setSubmitMsg("Select all markets before submitting");
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    setDepositStatus("idle");
    try {
      const bet = await apiFetch<Bet>("/bets", getAccessToken, {
        method: "POST",
        body: JSON.stringify({
          roundId: round.id,
          picks: round.markets.map((m) => ({ marketId: m.id, choice: picks[m.id] })),
        }),
      });
      setPendingBetId(bet.id);
      setDepositStatus("pending");
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleRound(roundId: string) {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) next.delete(roundId);
      else next.add(roundId);
      return next;
    });
  }

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <img src="/red-ring-full.png" alt="" className="h-16 w-16 object-contain opacity-60" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Login to enter this arena</p>
        <LoginButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <RingSpinner size="md" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Entering arena...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-red-400">Unable to load arena. Please refresh.</p>
      </div>
    );
  }

  const { contest, rounds } = data;
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const activeRoundId = rounds.find((r) => r.status === "OPEN")?.id;
  const resolvedCount = rounds.filter((r) => r.status === "RESOLVED").length;

  const wallet = user?.wallet?.address?.toLowerCase();
  const myBestEntry = leaderboard.find(
    (e) => e.user.walletAddress?.toLowerCase() === wallet,
  );

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500 transition-colors duration-200 hover:text-wolf-gray-300">
        <span>&larr;</span> Back to arenas
      </Link>

      {/* Arena Header */}
      <header className="mt-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-wolf-gray-600">Arena</p>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-[0.08em] text-white">
              {contest.name || contest.contestCategory || "Contest"}
            </h1>
          </div>
          <div className="text-right">
            {contest.status !== "RESOLVED" && contest.status !== "PAID" && (
              <CountdownTimer endTime={contest.endTime} label="Ends" size="lg" />
            )}
            {(contest.status === "RESOLVED" || contest.status === "PAID") && (
              <span className="rounded-[10px] border border-wolf-amber/20 bg-wolf-amber/10 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-amber-light">
                {contest.status}
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBlock label="Entry" value={`${contest.entryFee}`} />
          <StatBlock label="Rounds" value={`${resolvedCount}/${rounds.length}`} />
          <StatBlock label="Players" value={contest.participantCount || 0} />
          <StatBlock label="Your Rank" value={myBestEntry ? `#${myBestEntry.rank}` : "\u2014"} accent />
        </div>
      </header>

      {/* Rounds */}
      <section>
        <h2 className="mb-4 font-serif text-lg font-semibold tracking-[0.08em] text-white">Rounds</h2>
        <div className="flex flex-col gap-3">
          {sortedRounds.map((round) => {
            const isOpen = round.status === "OPEN";
            const isResolved = round.status === "RESOLVED";
            const isLocked = round.status === "LOCKED";
            const isUpcoming = round.status === "UPCOMING";
            const userBet = userBets.get(round.id);
            const isExpanded = expandedRounds.has(round.id) || isOpen;
            const badge = roundStatusStyles[round.status] || "bg-white/[0.03] text-wolf-gray-500 border border-white/[0.06]";

            return (
              <ArenaCard
                key={round.id}
                glow={isOpen ? "red" : "none"}
                className={`transition-all duration-300 ${
                  isOpen ? "p-5" : "p-4"
                } ${
                  isUpcoming && !isExpanded ? "opacity-30" : ""
                } ${
                  !isOpen && !isExpanded ? "hover:bg-white/[0.04]" : ""
                }`}
              >
                {/* Round Header */}
                <button
                  onClick={() => !isOpen && toggleRound(round.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                  disabled={isOpen}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-serif font-semibold tracking-[0.08em] text-white ${isOpen ? "text-base" : "text-sm"}`}>
                      Round {round.roundNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.15em] ${badge}`}>
                      {isOpen && <img src="/red-ring-full.png" alt="" className="h-2.5 w-2.5 object-contain" />}
                      {isOpen ? "LIVE" : round.status}
                    </span>
                    {round.participantCount !== undefined && round.participantCount > 0 && (
                      <span className="text-[12px] font-medium text-wolf-gray-500">
                        {round.participantCount} {round.participantCount === 1 ? "player" : "players"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {userBet && (
                      <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-amber-light">
                        Entered
                      </span>
                    )}
                    {isOpen && <CountdownTimer endTime={round.endTime} />}
                    {!isOpen && (
                      <span className="text-[12px] text-wolf-gray-600">{isExpanded ? "\u25BC" : "\u25B6"}</span>
                    )}
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="mt-4">
                    {/* OPEN — not yet bet */}
                    {isOpen && !userBet && (
                      <>
                        <div className="flex flex-col gap-3">
                          {round.markets.map((market) => (
                            <MarketRow
                              key={market.id}
                              market={market}
                              selectedChoice={picks[market.id]}
                              onSelect={handleSelect}
                              disabled={false}
                              livePrice={livePrices[market.asset]}
                            />
                          ))}
                        </div>
                        {betCheckDone && (
                          <div className="mt-5 flex flex-col items-center gap-3">
                            {depositStatus === "idle" && (
                              <GlowButton
                                variant="primary"
                                onClick={() => handleSubmit(round)}
                                disabled={submitting}
                                className="w-full max-w-xs py-3"
                              >
                                {submitting ? "Placing bet..." : `Submit Bet \u2014 ${contest.entryFee} HYPE`}
                              </GlowButton>
                            )}
                            {depositStatus === "pending" && (
                              <div className="flex items-center gap-2 rounded-[10px] border border-wolf-amber/20 bg-wolf-amber/10 px-4 py-3">
                                <RingSpinner size="md" />
                                <span className="text-xs font-semibold text-wolf-amber-light">Confirming deposit...</span>
                              </div>
                            )}
                            {depositStatus === "confirmed" && (
                              <div className="flex items-center gap-2 rounded-[10px] border border-green-500/20 bg-wolf-green/10 px-4 py-3">
                                <svg className="h-4 w-4 text-wolf-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs font-semibold text-wolf-green">Bet confirmed!</span>
                              </div>
                            )}
                            {depositStatus === "refunded" && (
                              <div className="flex flex-col items-center gap-2">
                                <div className="rounded-[10px] border border-red-600/20 bg-red-600/10 px-4 py-3">
                                  <span className="text-xs font-semibold text-red-400">Deposit failed. No funds charged.</span>
                                </div>
                                <button
                                  onClick={() => { setDepositStatus("idle"); setPendingBetId(null); }}
                                  className="text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500 underline hover:text-wolf-gray-300"
                                >
                                  Try again
                                </button>
                              </div>
                            )}
                            {depositStatus === "timeout" && (
                              <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                                <span className="text-xs font-medium text-wolf-gray-500">Deposit in progress. Check back shortly.</span>
                              </div>
                            )}
                            {submitMsg && (
                              <p className={`text-xs font-semibold ${submitMsg.includes("fail") || submitMsg.includes("Fail") ? "text-red-400" : "text-wolf-gray-500"}`}>
                                {submitMsg}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* OPEN — already bet */}
                    {isOpen && userBet && (
                      <>
                        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Your Picks</p>
                        <UserPicksDisplay bet={userBet} />
                        <p className="mt-4 mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Live Markets</p>
                        <div className="flex flex-col gap-3">
                          {round.markets.map((market) => (
                            <MarketRow
                              key={market.id}
                              market={market}
                              onSelect={() => {}}
                              disabled
                              livePrice={livePrices[market.asset]}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Resolved / Locked */}
                    {(isResolved || isLocked) && (
                      <>
                        {userBet ? (
                          <>
                            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Your Picks</p>
                            <UserPicksDisplay bet={userBet} />
                            {userBet.score && (
                              <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
                                <span>Rank <span className="font-mono text-wolf-gray-300">#{userBet.score.rank}</span></span>
                                <span>Score <span className="font-mono text-wolf-gray-300">{userBet.score.totalPoints.toFixed(4)}</span></span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {round.markets.map((market) => (
                              <MarketRow key={market.id} market={market} onSelect={() => {}} disabled />
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Upcoming */}
                    {isUpcoming && (
                      <p className="text-xs font-medium text-wolf-gray-500">
                        Starts at {new Date(round.startTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </ArenaCard>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mt-8">
        <Leaderboard
          entries={leaderboard}
          loading={lbLoading}
          showPayout={contest.status === "PAID"}
          currentUserWallet={user?.wallet?.address}
          activeRoundId={activeRoundId}
        />
      </section>
    </div>
  );
}

function UserPicksDisplay({ bet }: { bet: Bet }) {
  return (
    <div className="flex flex-col gap-1.5">
      {bet.picks.map((pick) => (
        <div key={pick.id} className="flex items-center justify-between text-sm">
          <span className="font-serif text-xs tracking-[0.08em] text-wolf-gray-400">{pick.market.asset}</span>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[12px] font-semibold ${
              pick.choice === "YES"
                ? "bg-wolf-green/10 text-wolf-green"
                : "bg-red-600/10 text-red-400"
            }`}
          >
            {pick.choice} @ {parseFloat(String(pick.entryOdds)).toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

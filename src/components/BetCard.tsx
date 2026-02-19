"use client";

import Link from "next/link";
import { Bet } from "@/types/contest";
import ArenaCard from "./arena/ArenaCard";
import RingSpinner from "./arena/RingSpinner";

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function BetCard({ bet, payoutAmount }: { bet: Bet; payoutAmount?: number }) {
  const contest = bet.round.contest;
  const isPending = bet.depositStatus === "PENDING";
  const isRefunded = bet.depositStatus === "REFUNDED";

  return (
    <Link href={`/contests/${contest.id}`}>
      <ArenaCard
        glow={payoutAmount && payoutAmount > 0 ? "green" : isPending ? "red" : "none"}
        className={`p-4 transition-all duration-300 hover:bg-white/[0.04] ${
          isRefunded ? "opacity-40" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-sm font-semibold tracking-[0.08em] text-white">
              {contest.name || formatCategory(contest.contestCategory) || "Contest"}
              {bet.round.roundNumber && (
                <span className="ml-2 font-sans text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
                  R{bet.round.roundNumber}
                </span>
              )}
            </p>
          </div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
            {contest.status}
          </span>
        </div>

        {isPending && (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-red-600/20 bg-red-600/10 px-3 py-2">
            <RingSpinner size="sm" />
            <span className="text-xs font-semibold text-red-400">Processing deposit...</span>
          </div>
        )}

        {isRefunded && (
          <div className="mt-3 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <span className="text-xs font-semibold text-wolf-gray-500">Refunded</span>
          </div>
        )}

        {payoutAmount !== undefined && payoutAmount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-green-500/20 bg-wolf-green/10 px-3 py-2">
            <span className="text-sm font-bold text-wolf-green">+{payoutAmount} HYPE</span>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          {bet.picks.map((pick) => (
            <div key={pick.id} className="flex items-center justify-between text-sm">
              <span className="font-mono text-xs text-wolf-gray-500">{pick.market.asset}</span>
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

        {bet.score && (
          <div className="mt-3 flex items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
            <span>Rank <span className="font-mono text-wolf-gray-300">#{bet.score.rank}</span></span>
            <span>Score <span className="font-mono text-wolf-gray-300">{bet.score.totalPoints.toFixed(4)}</span></span>
          </div>
        )}

        <p className="mt-2 text-[12px] font-medium text-wolf-gray-600">
          {new Date(bet.submittedAt).toLocaleString()}
        </p>
      </ArenaCard>
    </Link>
  );
}

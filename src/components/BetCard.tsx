"use client";

import Link from "next/link";
import { Bet } from "@/types/contest";

const statusStyles: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  UPCOMING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  CLOSED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
  RESOLVED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  PAID: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

function formatCategory(cat: string) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function BetCard({ bet, payoutAmount }: { bet: Bet; payoutAmount?: number }) {
  const participantCount = bet.contest.participantCount;
  const badge = statusStyles[bet.contest.status] || statusStyles.CLOSED;
  const isPending = bet.depositStatus === "PENDING";
  const isRefunded = bet.depositStatus === "REFUNDED";

  return (
    <Link href={`/contests/${bet.contestId}`}>
    <div className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
      isRefunded
        ? "border-zinc-200 opacity-60 dark:border-zinc-700"
        : isPending
        ? "border-amber-300 dark:border-amber-700"
        : payoutAmount && payoutAmount > 0
        ? "border-green-300 hover:border-green-500 dark:border-green-700 dark:hover:border-green-500"
        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {bet.contest.name || formatCategory(bet.contest.contestCategory) || "Contest"}
          </p>
          {participantCount !== undefined && participantCount > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {participantCount} {participantCount === 1 ? "player" : "players"}
            </p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
          {bet.contest.status}
        </span>
      </div>

      {isPending && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Processing deposit...
          </span>
        </div>
      )}

      {isRefunded && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Refunded
          </span>
        </div>
      )}

      {payoutAmount !== undefined && payoutAmount > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
            +{payoutAmount} HYPE
          </span>
          <span className="text-xs text-green-600 dark:text-green-500">Paid</span>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {bet.picks.map((pick) => (
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

      {bet.score && (
        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
          <span>Rank #{bet.score.rank}</span>
          <span>Score {bet.score.totalPoints.toFixed(4)}</span>
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-500">
        {new Date(bet.submittedAt).toLocaleString()}
      </p>
    </div>
    </Link>
  );
}

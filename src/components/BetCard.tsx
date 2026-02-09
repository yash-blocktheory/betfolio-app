"use client";

import Link from "next/link";
import { Bet } from "@/types/contest";

export default function BetCard({ bet }: { bet: Bet }) {
  const payout = bet.payouts?.find((p) => p.amount > 0);

  return (
    <Link href={`/contests/${bet.contestId}`}>
    <div className={`w-full rounded-lg border p-4 text-left transition-colors ${
      payout
        ? "border-green-300 dark:border-green-700 hover:border-green-500 dark:hover:border-green-500"
        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {bet.contest.name || bet.contest.contestCategory || "Contest"}
        </p>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
          {bet.contest.status}
        </span>
      </div>
      {payout && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
            +{payout.amount} HYPE
          </span>
          {payout.payoutTxHash && (
            <span className="text-xs text-green-600 dark:text-green-500">Paid</span>
          )}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        {bet.picks.map((pick) => (
          <div
            key={pick.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-zinc-600 dark:text-zinc-400">{pick.market.asset}</span>
            <span
              className={`rounded px-2 py-0.5 font-mono text-xs ${
                pick.choice === "YES"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
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

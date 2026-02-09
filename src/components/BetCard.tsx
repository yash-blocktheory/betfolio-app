"use client";

import Link from "next/link";
import { Bet } from "@/types/contest";

export default function BetCard({ bet }: { bet: Bet }) {
  return (
    <Link href={`/contests/${bet.contestId}`}>
    <div className="w-full rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {bet.contest.name || bet.contest.contestCategory || "Contest"}
        </p>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
          {bet.contest.status}
        </span>
      </div>
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
      <p className="mt-3 text-xs text-zinc-500">
        {new Date(bet.submittedAt).toLocaleString()}
      </p>
    </div>
    </Link>
  );
}

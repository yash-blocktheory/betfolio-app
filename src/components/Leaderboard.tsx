"use client";

import { LeaderboardEntry } from "@/types/contest";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  showPayout?: boolean;
}

export default function Leaderboard({ entries, loading, showPayout }: LeaderboardProps) {
  if (loading) {
    return <p className="text-center text-sm text-zinc-500">Loading leaderboard...</p>;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Leaderboard</h2>
      {entries.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">Results not available yet</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="w-16">Rank</span>
            <span className="flex-1">User</span>
            <span className="w-20 text-right">Score</span>
            {showPayout && <span className="w-24 text-right">Payout</span>}
          </div>
          {entries.map((entry) => {
            const displayUser = entry.user.walletAddress
              ? `${entry.user.walletAddress.slice(0, 6)}...${entry.user.walletAddress.slice(-4)}`
              : entry.user.id?.slice(0, 8) || "Unknown";

            return (
              <div
                key={entry.betId}
                className={`flex items-center px-4 py-3 text-sm ${
                  entry.rank === 1 ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                } border-b border-zinc-100 last:border-b-0 dark:border-zinc-800`}
              >
                <span className="w-16 font-mono font-medium">
                  #{entry.rank}
                </span>
                <span className="flex-1 font-mono text-zinc-600 dark:text-zinc-400">
                  {displayUser}
                </span>
                <span className="w-20 text-right font-mono font-medium">
                  {entry.totalPoints.toFixed(4)}
                </span>
                {showPayout && (
                  <span className="w-24 text-right font-mono font-medium text-green-600 dark:text-green-400">
                    {entry.payout && entry.payout > 0 ? `${entry.payout} HYPE` : "—"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

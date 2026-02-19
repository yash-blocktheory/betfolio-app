"use client";

import { LeaderboardEntry } from "@/types/contest";
import ArenaCard from "./arena/ArenaCard";
import RingSpinner from "./arena/RingSpinner";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  showPayout?: boolean;
  currentUserWallet?: string;
  activeRoundId?: string;
}

const rankAccent: Record<number, string> = {
  1: "text-wolf-amber-light",
  2: "text-wolf-gray-300",
  3: "text-wolf-amber-dark",
};

export default function Leaderboard({ entries, loading, showPayout, currentUserWallet, activeRoundId }: LeaderboardProps) {
  if (loading) {
    return (
      <ArenaCard className="p-6">
        <div className="flex items-center justify-center gap-2">
          <RingSpinner size="sm" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Loading rankings...</span>
        </div>
      </ArenaCard>
    );
  }

  return (
    <ArenaCard className="overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="font-serif text-lg font-semibold tracking-[0.08em] text-white">
          Leaderboard
        </h2>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8">
          <img src="/red-ring-full.png" alt="" className="h-8 w-8 object-contain opacity-20" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">
            No rankings yet
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex min-w-[400px] items-center border-b border-white/[0.04] px-4 sm:px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
            <span className="w-10 shrink-0">#</span>
            <span className="w-10 shrink-0 text-center">Rnd</span>
            <span className="flex-1 min-w-0">Player</span>
            <span className="w-16 sm:w-20 shrink-0 text-right">Score</span>
            {showPayout && <span className="w-20 sm:w-24 shrink-0 text-right">Payout</span>}
          </div>

          {/* Rows */}
          {entries.map((entry) => {
            const displayUser = entry.user.email
              ? entry.user.email.split("@")[0]
              : entry.user.walletAddress
              ? `${entry.user.walletAddress.slice(0, 6)}...${entry.user.walletAddress.slice(-4)}`
              : entry.user.id?.slice(0, 8) || "Unknown";
            const isCurrentUser =
              currentUserWallet &&
              entry.user.walletAddress?.toLowerCase() === currentUserWallet.toLowerCase();
            const isActiveRound = activeRoundId && entry.roundId === activeRoundId;
            const rankColor = rankAccent[entry.rank] || "text-wolf-gray-300";
            const isTopThree = entry.rank <= 3;

            return (
              <div
                key={entry.betId}
                className={`flex min-w-[400px] items-center px-4 sm:px-5 transition-all duration-200 ${
                  isTopThree ? "py-3.5" : "py-2.5"
                } ${
                  isCurrentUser && isActiveRound
                    ? "border-l-2 border-l-wolf-green bg-wolf-green/5"
                    : isCurrentUser
                    ? "border-l-2 border-l-wolf-amber bg-wolf-amber/5"
                    : "border-l-2 border-l-transparent"
                } border-b border-white/[0.04] last:border-b-0`}
              >
                <span className={`w-10 shrink-0 font-mono font-bold ${rankColor} ${
                  isTopThree ? "text-lg" : "text-base"
                } flex items-center gap-1`}>
                  {entry.rank === 1 && <img src="/red-ring-full.png" alt="" className="h-3.5 w-3.5 object-contain" />}
                  {entry.rank}
                </span>
                <span className="w-10 shrink-0 text-center">
                  <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12px] text-wolf-gray-500">
                    R{entry.roundNumber}
                  </span>
                </span>
                <span className={`flex-1 min-w-0 truncate font-mono text-wolf-gray-400 ${
                  isTopThree ? "text-sm" : "text-xs"
                }`}>
                  {displayUser}
                  {isCurrentUser && (
                    <span className="ml-1.5 rounded bg-wolf-amber/15 px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-amber-light">you</span>
                  )}
                </span>
                <span className={`w-16 sm:w-20 shrink-0 text-right font-mono font-semibold text-wolf-gray-200 ${
                  isTopThree ? "text-base" : "text-sm"
                }`}>
                  {entry.totalPoints.toFixed(4)}
                </span>
                {showPayout && (
                  <span className="w-20 sm:w-24 shrink-0 text-right font-mono text-sm font-semibold text-wolf-green">
                    {entry.payout && entry.payout > 0 ? `${entry.payout} HYPE` : "\u2014"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ArenaCard>
  );
}

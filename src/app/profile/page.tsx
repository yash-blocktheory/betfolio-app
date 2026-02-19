"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { apiFetch } from "@/lib/api";
import { Bet, LeaderboardEntry, PaginatedResponse } from "@/types/contest";
import LoginButton from "@/components/LoginButton";
import ArenaCard from "@/components/arena/ArenaCard";
import StatBlock from "@/components/arena/StatBlock";

export default function ProfilePage() {
  const router = useRouter();
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const [totalBets, setTotalBets] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const betsRes = await apiFetch<PaginatedResponse<Bet>>("/bets/me?limit=100", getAccessToken);
    const bets = betsRes.data;
    setTotalBets(bets.length);

    const wallet = user?.wallet?.address?.toLowerCase();
    if (!wallet) return;

    const paidBets = bets.filter((b) => b.round.contest.status === "PAID");
    let winnings = 0;

    const contestIds = [...new Set(paidBets.map((b) => b.round.contest.id))];
    await Promise.all(
      contestIds.map((contestId) =>
        apiFetch<PaginatedResponse<LeaderboardEntry>>(
          `/contests/${contestId}/leaderboard?limit=100`,
          getAccessToken,
        )
          .then((res) => {
            const me = res.data.find(
              (e) => e.user.walletAddress?.toLowerCase() === wallet,
            );
            if (me?.payout && me.payout > 0) {
              winnings += me.payout;
            }
          })
          .catch(() => {}),
      ),
    );

    setTotalWinnings(winnings);
  }, [getAccessToken, user?.wallet?.address]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    setLoading(true);
    fetchStats()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready, authenticated, fetchStats]);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <img src="/red-ring-full.png" alt="" className="h-16 w-16 object-contain opacity-60" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Login to view your profile</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <img src="/red-ring-full.png" alt="" className="h-8 w-8 object-contain" />
        <h1 className="font-serif text-2xl font-bold tracking-[0.08em] text-white">Profile</h1>
      </div>

      <ArenaCard className="p-6">
        {/* User Info */}
        <div className="mb-6 flex flex-col gap-3">
          {user?.email?.address && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Email</p>
              <p className="mt-0.5 text-sm font-medium text-wolf-gray-200">{user.email.address}</p>
            </div>
          )}
          {user?.wallet?.address && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">Wallet</p>
              <p className="mt-0.5 font-mono text-sm text-wolf-gray-400">
                {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <StatBlock label="Bets Placed" value={totalBets} />
            <StatBlock label="HYPE Won" value={totalWinnings > 0 ? totalWinnings.toFixed(2) : "0"} accent />
          </div>
        )}

        {loading && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="h-[72px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
            <div className="h-[72px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout().then(() => router.push("/"))}
          className="w-full rounded-[10px] border border-white/[0.06] py-3 text-xs font-semibold uppercase tracking-[0.15em] text-wolf-gray-500 transition-all duration-300 hover:border-red-600/30 hover:text-red-400"
        >
          Exit Arena
        </button>
      </ArenaCard>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { apiFetch } from "@/lib/api";
import { Bet, LeaderboardEntry, PaginatedResponse } from "@/types/contest";
import LoginButton from "@/components/LoginButton";

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

    const paidBets = bets.filter((b) => b.contest.status === "PAID");
    let winnings = 0;

    await Promise.all(
      paidBets.map((bet) =>
        apiFetch<PaginatedResponse<LeaderboardEntry>>(
          `/contests/${bet.contestId}/leaderboard?limit=100`,
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">Please log in to view your profile.</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Profile</h1>

      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
        {/* User Info */}
        <div className="mb-6 flex flex-col gap-2">
          {user?.email?.address && (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
              <p className="text-sm">{user.email.address}</p>
            </div>
          )}
          {user?.wallet?.address && (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Wallet</p>
              <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
              <p className="text-xl font-bold">{totalBets}</p>
              <p className="text-xs text-zinc-500">Bets Placed</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
              <p className="text-xl font-bold">
                {totalWinnings > 0 ? totalWinnings.toFixed(2) : "0"}
              </p>
              <p className="text-xs text-zinc-500">HYPE Won</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => logout().then(() => router.push("/"))}
          className="w-full rounded-lg border border-zinc-300 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

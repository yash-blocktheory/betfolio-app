"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Contest } from "@/types/contest";

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

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}

export default function ContestCard({ contest }: { contest: Contest }) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [countdownLabel, setCountdownLabel] = useState<string>("");

  useEffect(() => {
    if (contest.status === "RESOLVED" || contest.status === "PAID" || contest.status === "CLOSED") return;

    function tick() {
      const now = Date.now();
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();

      if (now < start) {
        setCountdownLabel("Starts");
        setCountdown(formatCountdown(start - now));
      } else if (now < end) {
        setCountdownLabel("Ends");
        setCountdown(formatCountdown(end - now));
      } else {
        setCountdown(null);
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime, contest.status]);

  const badge = statusStyles[contest.status] || statusStyles.CLOSED;

  return (
    <Link href={`/contests/${contest.id}`}>
      <div className="w-full rounded-xl border border-zinc-200 p-4 text-left transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-700 dark:hover:border-zinc-500">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {contest.name || formatCategory(contest.contestCategory) || "Contest"}
            </p>
            {contest.participantCount !== undefined && contest.participantCount > 0 && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {contest.participantCount} {contest.participantCount === 1 ? "player" : "players"}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
              {contest.status}
            </span>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              {contest.entryFee} HYPE
            </span>
          </div>
        </div>

        {countdown && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {countdownLabel} {countdown}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
          <span>Starts: {new Date(contest.startTime).toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}

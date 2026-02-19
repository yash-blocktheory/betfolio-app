"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Contest } from "@/types/contest";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-red-600/10 text-red-400 border border-red-600/20",
  UPCOMING: "bg-white/[0.03] text-wolf-gray-500 border border-white/[0.06]",
  SETTLING: "bg-wolf-amber/10 text-wolf-amber-light border border-wolf-amber/20",
  RESOLVED: "bg-wolf-amber/10 text-wolf-amber-light border border-wolf-amber/20",
  PAID: "bg-wolf-amber/10 text-wolf-amber-light border border-wolf-amber/20",
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
    if (contest.status === "RESOLVED" || contest.status === "PAID" || contest.status === "SETTLING") return;

    function tick() {
      const now = Date.now();
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();

      if (now < start) {
        setCountdownLabel("STARTS");
        setCountdown(formatCountdown(start - now));
      } else if (now < end) {
        setCountdownLabel("ENDS");
        setCountdown(formatCountdown(end - now));
      } else {
        setCountdown(null);
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [contest.startTime, contest.endTime, contest.status]);

  const badge = statusStyles[contest.status] || "bg-white/[0.03] text-wolf-gray-500 border border-white/[0.06]";
  const isLive = contest.status === "ACTIVE";

  return (
    <Link href={`/contests/${contest.id}`}>
      <div className={`group w-full rounded-xl border bg-white/[0.02] p-3 sm:p-4 text-left transition-all duration-300 hover:bg-white/[0.04] ${
        isLive
          ? "border-red-600/20 shadow-[0_0_30px_#dc26260f,inset_0_1px_0_#ffffff0a] hover:shadow-[0_0_40px_#dc26261f,0_0_60px_#dc26260d,inset_0_1px_0_#ffffff0f]"
          : "border-white/[0.06] hover:border-white/[0.15]"
      }`}>
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-sm font-semibold tracking-[0.05em] sm:tracking-[0.08em] text-white">
              {contest.name || formatCategory(contest.contestCategory) || "Contest"}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs font-medium text-wolf-gray-500">
              {contest.participantCount !== undefined && contest.participantCount > 0 && (
                <span>{contest.participantCount} {contest.participantCount === 1 ? "player" : "players"}</span>
              )}
              {contest.roundCount !== undefined && contest.roundCount > 0 && (
                <span>{contest.roundCount} rounds</span>
              )}
              {contest.roundDurationSeconds > 0 && (
                <span>{contest.roundDurationSeconds < 60 ? `${contest.roundDurationSeconds}s` : `${Math.floor(contest.roundDurationSeconds / 60)}m`} each</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold uppercase tracking-[0.15em] ${badge}`}>
              {isLive && <img src="/red-ring-full.png" alt="" className="h-2.5 w-2.5 object-contain" />}
              {isLive ? "LIVE" : contest.status}
            </span>
            {contest.status !== "PAID" && contest.status !== "RESOLVED" && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[12px] font-semibold text-wolf-gray-300">
                {contest.entryFee} HYPE
              </span>
            )}
          </div>
        </div>

        {countdown && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-wolf-gray-500">
              <span className="text-[12px] uppercase tracking-[0.15em]">{countdownLabel}</span>
              <span className="text-wolf-gray-300">{countdown}</span>
            </span>
          </div>
        )}

        {(contest.status === "PAID" || contest.status === "RESOLVED") && (
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-wolf-gray-500">
            Ended {new Date(contest.endTime).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>
    </Link>
  );
}

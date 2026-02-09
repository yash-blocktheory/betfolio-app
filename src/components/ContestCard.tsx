"use client";

import Link from "next/link";
import { Contest } from "@/types/contest";

export default function ContestCard({ contest }: { contest: Contest }) {
  return (
    <Link href={`/contests/${contest.id}`}>
      <div className="w-full rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {contest.name || contest.contestCategory || `Contest`}
          </p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
            {contest.status}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>Entry Fee: {contest.entryFee}</p>
          <p>Starts: {new Date(contest.startTime).toLocaleString()}</p>
          <p>Ends: {new Date(contest.endTime).toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}

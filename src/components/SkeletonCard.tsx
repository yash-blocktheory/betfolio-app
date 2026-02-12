export default function SkeletonCard() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

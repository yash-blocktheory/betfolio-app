export default function SkeletonCard() {
  return (
    <div className="w-full animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-white/[0.05]" />
        <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-white/[0.03]" />
        <div className="h-3 w-40 rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

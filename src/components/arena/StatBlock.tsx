"use client";

interface StatBlockProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function StatBlock({ label, value, accent }: StatBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span
        className={`text-xl font-bold tracking-tight ${
          accent ? "text-wolf-amber-light" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">
        {label}
      </span>
    </div>
  );
}

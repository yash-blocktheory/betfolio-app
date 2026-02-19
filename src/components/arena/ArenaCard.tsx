"use client";

interface ArenaCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "red" | "green" | "none";
}

export default function ArenaCard({ children, className = "", glow = "none" }: ArenaCardProps) {
  const glowStyle =
    glow === "red"
      ? "shadow-[0_0_30px_#dc26260f,inset_0_1px_0_#ffffff0a] border-red-600/20"
      : glow === "green"
      ? "shadow-[0_0_30px_rgba(34,197,94,0.06),inset_0_1px_0_#ffffff0a] border-green-500/20"
      : "border-white/[0.06]";

  return (
    <div
      className={`rounded-xl border bg-white/[0.02] backdrop-blur-sm ${glowStyle} ${className}`}
    >
      {children}
    </div>
  );
}

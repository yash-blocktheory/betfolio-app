"use client";

interface GlowButtonProps {
  children: React.ReactNode;
  variant: "green" | "red" | "primary" | "muted";
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function GlowButton({
  children,
  variant,
  active,
  disabled,
  onClick,
  className = "",
}: GlowButtonProps) {
  const base =
    "relative rounded-[10px] px-3 sm:px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out cursor-pointer active:scale-[0.96]";

  const variants = {
    green: active
      ? "bg-green-500/40 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-500/40"
      : "border border-white/[0.08] text-green-500/40 hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-wolf-green hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    red: active
      ? "bg-red-600/40 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-600/30"
      : "border border-white/[0.08] text-red-500/70 hover:bg-white/[0.04] hover:border-white/[0.15] hover:text-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]",
    primary:
      "bg-gradient-to-b from-[#1e0a0a99] to-[#0f0505cc] border border-red-600/30 text-wolf-gray-300 shadow-[0_0_30px_#dc26260f,inset_0_1px_0_#ffffff0a] hover:shadow-[0_0_40px_#dc26261f,0_0_60px_#dc26260d,inset_0_1px_0_#ffffff0f] hover:text-white",
    muted:
      "border border-white/[0.06] text-wolf-gray-500 hover:border-white/[0.15] hover:text-wolf-gray-300 hover:bg-white/[0.03]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${
        disabled ? "pointer-events-none opacity-30" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

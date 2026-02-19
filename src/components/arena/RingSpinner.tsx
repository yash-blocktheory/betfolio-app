"use client";

interface RingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export default function RingSpinner({ size = "md" }: RingSpinnerProps) {
  return (
    <img
      src="/red-ring-full.png"
      alt=""
      className={`${sizes[size]} animate-spin object-contain`}
      aria-hidden
    />
  );
}

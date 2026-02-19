"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: string;
  label?: string;
  size?: "sm" | "lg";
}

export default function CountdownTimer({ endTime, label, size = "sm" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    function tick() {
      const remaining = new Date(endTime).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft(null);
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      setIsUrgent(totalSeconds < 30);
      setIsCritical(totalSeconds < 5);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return null;

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-1">
        {label && (
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-wolf-gray-500">
            {label}
          </span>
        )}
        <span
          className={`font-mono text-3xl font-bold tracking-wider transition-all duration-300 ${
            isCritical
              ? "animate-countdown-urgent text-red-400 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]"
              : isUrgent
              ? "animate-countdown-pulse text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.3)]"
              : "text-white"
          }`}
        >
          {timeLeft}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-sm transition-all duration-300 ${
        isCritical
          ? "animate-countdown-urgent text-red-400 drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]"
          : isUrgent
          ? "animate-countdown-pulse text-red-400"
          : "text-wolf-gray-400"
      }`}
    >
      {label && <span className="text-[12px] uppercase tracking-[0.15em]">{label}</span>}
      {timeLeft}
    </span>
  );
}

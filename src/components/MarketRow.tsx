"use client";

import { Market } from "@/types/contest";
import GlowButton from "./arena/GlowButton";

type Choice = "YES" | "NO";

interface MarketRowProps {
  market: Market;
  selectedChoice?: Choice;
  onSelect: (marketId: string, choice: Choice) => void;
  disabled?: boolean;
  livePrice?: number;
}

export default function MarketRow({ market, selectedChoice, onSelect, disabled, livePrice }: MarketRowProps) {
  const startPrice = parseFloat(market.startPrice);
  const displayPrice = market.endPrice ? parseFloat(market.endPrice) : livePrice;
  const pctChange = displayPrice ? ((displayPrice - startPrice) / startPrice) * 100 : null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4 transition-all duration-200 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base sm:text-lg font-bold tracking-[0.08em] text-white">{market.asset}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium">
            <span className="text-wolf-gray-500">
              <span className="font-mono">${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
            {displayPrice && (
              <>
                <span className="text-wolf-gray-600">&rarr;</span>
                <span className="font-mono text-wolf-gray-300">
                  ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {pctChange !== null && (
                  <span className={`font-mono font-bold ${pctChange >= 0 ? "text-wolf-green" : "text-red-400"}`}>
                    {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5 sm:gap-2">
          <GlowButton
            variant="green"
            active={selectedChoice === "YES"}
            disabled={disabled}
            onClick={() => onSelect(market.id, "YES")}
            className="min-w-[60px] sm:min-w-[76px] text-center font-mono text-xs"
          >
            YES {parseFloat(market.yesOdds).toFixed(2)}
          </GlowButton>
          <GlowButton
            variant="red"
            active={selectedChoice === "NO"}
            disabled={disabled}
            onClick={() => onSelect(market.id, "NO")}
            className="min-w-[60px] sm:min-w-[76px] text-center font-mono text-xs"
          >
            NO {parseFloat(market.noOdds).toFixed(2)}
          </GlowButton>
        </div>
      </div>
    </div>
  );
}

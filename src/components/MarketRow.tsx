"use client";

import { Market } from "@/types/contest";

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
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <div>
        <p className="text-sm font-medium">{market.asset}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="text-zinc-500">
            Open: <span className="font-mono">${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          {displayPrice && (
            <>
              <span className="text-zinc-400 dark:text-zinc-600">→</span>
              <span className="font-mono">
                ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {pctChange !== null && (
                <span className={`font-mono ${pctChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-3 text-sm">
        <button
          onClick={() => onSelect(market.id, "YES")}
          disabled={disabled}
          className={`rounded px-3 py-1 font-mono transition-colors ${
            selectedChoice === "YES"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          YES: {parseFloat(market.yesOdds).toFixed(4)}
        </button>
        <button
          onClick={() => onSelect(market.id, "NO")}
          disabled={disabled}
          className={`rounded px-3 py-1 font-mono transition-colors ${
            selectedChoice === "NO"
              ? "bg-red-600 text-white"
              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          NO: {parseFloat(market.noOdds).toFixed(4)}
        </button>
      </div>
    </div>
  );
}

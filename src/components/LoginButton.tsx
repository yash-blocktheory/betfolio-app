"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther } from "viem";
import { hyperliquidEvmTestnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: hyperliquidEvmTestnet,
  transport: http(),
});

export default function LoginButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.wallet?.address) return;
    const addr = user.wallet.address as `0x${string}`;
    publicClient.getBalance({ address: addr }).then((bal) => {
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    }).catch(() => setBalance(null));
  }, [user?.wallet?.address]);

  function copyAddress() {
    if (!user?.wallet?.address) return;
    navigator.clipboard.writeText(user.wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return null;
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-80"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        {user?.email?.address && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {user.email.address}
          </p>
        )}
        {user?.wallet?.address && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyAddress}
              title={user.wallet.address}
              className="font-mono text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {copied
                ? "Copied!"
                : `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
            </button>
            {balance !== null && (
              <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {balance} HYPE
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={logout}
        className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Logout
      </button>
    </div>
  );
}

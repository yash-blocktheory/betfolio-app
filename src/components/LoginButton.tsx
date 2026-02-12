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
  const { ready, authenticated, user, login } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.wallet?.address) return;
    const addr = user.wallet.address as `0x${string}`;

    function fetchBalance() {
      publicClient.getBalance({ address: addr }).then((bal) => {
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      }).catch(() => setBalance(null));
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 3000);
    return () => clearInterval(interval);
  }, [user?.wallet?.address]);

  function copyAddress() {
    if (!user?.wallet?.address) return;
    navigator.clipboard.writeText(user.wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) return null;

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
    <div className="flex items-center gap-3">
      {user?.wallet?.address && (
        <button
          onClick={copyAddress}
          title={user.wallet.address}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          {copied
            ? "Copied!"
            : `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
        </button>
      )}
      {balance !== null && (
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 font-mono text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {balance} HYPE
        </span>
      )}
    </div>
  );
}

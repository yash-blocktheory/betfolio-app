"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import LoginButton from "@/components/LoginButton";
import { createPublicClient, http, formatEther } from "viem";
import { hyperliquidEvmTestnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: hyperliquidEvmTestnet,
  transport: http(),
});

export default function WalletPage() {
  const { ready, authenticated, user } = usePrivy();
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const address = user?.wallet?.address;

  useEffect(() => {
    if (!address) return;
    const addr = address as `0x${string}`;
    publicClient
      .getBalance({ address: addr })
      .then((bal) => setBalance(parseFloat(formatEther(bal)).toFixed(4)))
      .catch(() => setBalance(null));

    const interval = setInterval(() => {
      publicClient
        .getBalance({ address: addr })
        .then((bal) => setBalance(parseFloat(formatEther(bal)).toFixed(4)))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [address]);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">Please log in to view your wallet.</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Wallet</h1>

      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
        {/* Balance */}
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Balance</p>
          <p className="mt-1 text-4xl font-bold">
            {balance !== null ? balance : "---"}
          </p>
          <p className="text-sm text-zinc-500">HYPE</p>
        </div>

        {/* Address */}
        {address && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={copyAddress}
              className="w-full rounded-lg bg-zinc-100 px-4 py-3 font-mono text-xs text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              {copied ? "Copied!" : address}
            </button>
            <a
              href={`https://testnet.purrsec.com/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              View on Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

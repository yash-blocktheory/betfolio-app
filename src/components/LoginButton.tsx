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
        className="cta-button rounded-[10px] border border-red-600/30 bg-gradient-to-b from-[#1e0a0a99] to-[#0f0505cc] px-6 py-2.5 text-sm font-semibold tracking-[0.1em] text-wolf-gray-300 shadow-[0_0_30px_#dc26260f,inset_0_1px_0_#ffffff0a] transition-all duration-300 hover:text-white hover:shadow-[0_0_40px_#dc26261f,0_0_60px_#dc26260d,inset_0_1px_0_#ffffff0f]"
      >
        Enter Arena
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user?.wallet?.address && (
        <button
          onClick={copyAddress}
          title={user.wallet.address}
          className="hidden sm:inline font-mono text-[12px] uppercase tracking-[0.15em] text-wolf-gray-500 transition-colors duration-200 hover:text-wolf-gray-300"
        >
          {copied
            ? "Copied!"
            : `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
        </button>
      )}
      {balance !== null && (
        <span className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-2 sm:px-2.5 py-1 font-mono text-[12px] font-semibold text-wolf-gray-300">
          {balance} <span className="text-red-600/80">HYPE</span>
        </span>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [copied, setCopied] = useState(false);

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
          <button
            onClick={copyAddress}
            title={user.wallet.address}
            className="font-mono text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {copied
              ? "Copied!"
              : `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
          </button>
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

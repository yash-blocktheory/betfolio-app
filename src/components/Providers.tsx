"use client";

import { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import ServerSignerSetup from "./ServerSignerSetup";
import { hyperliquidEvmTestnet } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (process.env.NODE_ENV === "development") {
      console.log("Privy App ID:", PRIVY_APP_ID || "NOT SET");
    }
  }, []);

  if (!mounted || !PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        defaultChain: hyperliquidEvmTestnet,
        supportedChains: [hyperliquidEvmTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      <ServerSignerSetup />
      {children}
    </PrivyProvider>
  );
}

"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { hyperliquidEvmTestnet } from "viem/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!appId || appId === "your_app_id_here") {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: hyperliquidEvmTestnet,
        supportedChains: [hyperliquidEvmTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

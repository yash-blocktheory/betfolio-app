"use client";

import { useEffect, useRef } from "react";
import { usePrivy, useSigners, useCreateWallet } from "@privy-io/react-auth";

const QUORUM_ID = process.env.NEXT_PUBLIC_PRIVY_SERVER_QUORUM_ID;

export default function ServerSignerSetup() {
  const { authenticated, user } = usePrivy();
  const { addSigners } = useSigners();
  const { createWallet } = useCreateWallet();
  const running = useRef(false);

  useEffect(() => {
    if (!authenticated || !user || running.current) return;

    const embeddedWallet = user.linkedAccounts.find(
      (a): a is Extract<typeof a, { type: "wallet" }> =>
        a.type === "wallet" && "walletClientType" in a && a.walletClientType === "privy"
    );

    running.current = true;

    (async () => {
      let walletAddress = embeddedWallet?.address;

      if (!walletAddress) {
        try {
          const wallet = await createWallet();
          walletAddress = wallet.address;
        } catch {
          running.current = false;
          return;
        }
      }

      if (QUORUM_ID && walletAddress) {
        try {
          await addSigners({
            address: walletAddress,
            signers: [{ signerId: QUORUM_ID, policyIds: [] }],
          });
        } catch {
          // safe to ignore — may already be registered
        }
      }

      running.current = false;
    })();
  }, [authenticated, user, addSigners, createWallet]);

  return null;
}

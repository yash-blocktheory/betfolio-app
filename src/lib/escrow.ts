import { encodeFunctionData, parseEther } from "viem";

export const ESCROW_CONTRACT_ADDRESS =
  "0x18870827214Ba6A1E9e38eC4E7D7e22C6cE735D9" as const;

const ESCROW_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "contestId", type: "uint256" }],
    outputs: [],
  },
] as const;

export function encodeDepositCall(escrowContestId: number): `0x${string}` {
  return encodeFunctionData({
    abi: ESCROW_ABI,
    functionName: "deposit",
    args: [BigInt(escrowContestId)],
  });
}

export function entryFeeToWei(entryFee: number): bigint {
  return parseEther(entryFee.toString());
}

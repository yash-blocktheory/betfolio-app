export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Contest {
  id: string;
  contestCategory: string;
  startTime: string;
  endTime: string;
  entryFee: number;
  status: string;
  name?: string;
  description?: string;
  escrowContractAddress?: string;
  escrowContestId?: number;
  escrowStatus?: string;
  participantCount?: number;
}

export interface Market {
  id: string;
  asset: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  startPrice: string;
  endPrice: string | null;
  yesOdds: string;
  noOdds: string;
  status: string;
  resolvedOutcome: string | null;
}

export interface ContestDetail {
  contest: Contest;
  markets: Market[];
}

export interface Pick {
  id: string;
  marketId: string;
  choice: string;
  entryOdds: number;
  market: Market;
}

export interface Payout {
  amount: number;
  payoutTxHash: string | null;
  status: string;
}

export interface Bet {
  id: string;
  userId: string;
  contestId: string;
  totalEntryFee: number;
  depositTxHash: string | null;
  depositStatus: string;
  submittedAt: string;
  picks: Pick[];
  contest: Contest;
  score?: {
    totalPoints: number;
    rank: number;
  };
  payouts?: Payout[];
}

export interface LeaderboardEntry {
  betId: string;
  rank: number;
  totalPoints: number;
  payout: number | null;
  user: {
    id?: string;
    walletAddress?: string;
  };
}

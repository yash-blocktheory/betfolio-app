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
  roundDurationSeconds: number;
  status: string;
  name?: string;
  description?: string;
  escrowContractAddress?: string;
  escrowContestId?: number;
  escrowStatus?: string;
  participantCount?: number;
  roundCount?: number;
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

export interface Round {
  id: string;
  contestId: string;
  roundNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  participantCount?: number;
  markets: Market[];
}

export interface ContestDetail {
  contest: Contest;
  rounds: Round[];
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
  roundId: string;
  totalEntryFee: number;
  depositTxHash: string | null;
  depositStatus: string;
  submittedAt: string;
  picks: Pick[];
  round: Round & { contest: Contest };
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
  roundId: string;
  roundNumber: number;
  user: {
    id?: string;
    walletAddress?: string;
    email?: string | null;
  };
}

import { LeagueEnum, BetType, Market } from "@prisma/client";
import type { SerializedBetWithLegs } from "@/lib/serialize";

export type DateRange = "7d" | "30d" | "season" | "all";

export interface DashboardFilters {
  dateRange: DateRange;
  league?: LeagueEnum;
  sportsbook?: string;
}

export interface SummaryStats {
  totalWagered: number;
  netProfit: number;
  roi: number;
  winRate: number;
  avgOdds: number;
  avgStake: number;
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  voids: number;
  bestBook?: {
    name: string;
    profit: number;
  };
}

export interface ProfitByDate {
  date: string;
  cumulativeProfit: number;
  dailyProfit: number;
}

export interface SportBetTypeBreakdown {
  league: LeagueEnum;
  betType: BetType;
  profit: number;
  staked: number;
  roi: number;
  betCount: number;
}

export interface MarketPerformance {
  league: LeagueEnum;
  market: Market;
  profit: number;
  roi: number;
  record: string; // "W-L" format
  betCount: number;
}

export interface BookPerformance {
  sportsbook: string;
  profit: number;
  roi: number;
  betCount: number;
}

export interface DashboardAnalytics {
  summary: SummaryStats;
  profitByDate: ProfitByDate[];
  bySportBetType: SportBetTypeBreakdown[];
  bestMarkets: MarketPerformance[];
  worstMarkets: MarketPerformance[];
  byBook: BookPerformance[];
  recentBets: SerializedBetWithLegs[];
}


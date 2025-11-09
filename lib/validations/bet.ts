import { z } from "zod";
import { calculateBetOdds } from "@/lib/bet-helpers";
import { isPlayerMarket, isTeamMarket, isSpreadMarket, requiresQualifier } from "@/lib/market-helpers";
import { LeagueEnum, Market, MarketQualifier } from "@prisma/client";

const LEAGUE_ENUM_VALUES = Object.values(LeagueEnum) as [LeagueEnum, ...LeagueEnum[]];
const MARKET_ENUM_VALUES = Object.values(Market) as [Market, ...Market[]];
const MARKET_QUALIFIER_VALUES = Object.values(MarketQualifier) as [MarketQualifier, ...MarketQualifier[]];

export const legSchema = z.object({
  // Canonical fields (required)
  league: z.enum(LEAGUE_ENUM_VALUES),
  gameId: z.string().min(1, "Game is required"),
  market: z.enum(MARKET_ENUM_VALUES),
  
  // Optional canonical fields
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  qualifier: z.enum(MARKET_QUALIFIER_VALUES).optional(),
  threshold: z.coerce.number().optional(), // For over/under: positive only. For spread: can be negative or positive
  date: z.string().optional(), // Date for fetching games (UI only, event date comes from game)
  
  // Legacy/display fields (auto-populated, optional for backwards compatibility)
  description: z.string().optional(),
  eventName: z.string().optional(),
  
  // Required fields
  odds: z.coerce.number().min(1.01, "Odds must be greater than 1"),
  result: z.enum(["pending", "win", "loss", "void"] as const).default("pending"),
}).refine((data) => {
  // If market requires player, playerId must be provided
  if (isPlayerMarket(data.market) && !data.playerId) {
    return false;
  }
  return true;
}, {
  message: "Player is required for this market",
  path: ["playerId"],
}).refine((data) => {
  // If market requires team, teamId must be provided
  if (isTeamMarket(data.market) && !data.teamId) {
    return false;
  }
  return true;
}, {
  message: "Team is required for this market",
  path: ["teamId"],
}).refine((data) => {
  // If market is a spread market, threshold must be provided (can be negative or positive)
  if (isSpreadMarket(data.market)) {
    if (data.threshold === undefined || data.threshold === null) {
      return false;
    }
  }
  return true;
}, {
  message: "Differential is required for spread markets",
  path: ["threshold"],
}).refine((data) => {
  // If market requires qualifier (and is not a spread market), qualifier and threshold must be provided
  // For over/under markets, threshold should be positive
  if (requiresQualifier(data.market) && !isSpreadMarket(data.market)) {
    if (!data.qualifier || data.qualifier === MarketQualifier.NONE) {
      return false;
    }
    if (data.threshold === undefined || data.threshold === null) {
      return false;
    }
    // Over/under thresholds should be positive
    if (data.threshold <= 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Over/Under and threshold are required for this market",
  path: ["qualifier"],
});

export const betFormSchema = z.object({
  betType: z.enum(["straight", "same_game_parlay", "parlay"] as const).optional(),
  wager: z.coerce.number().positive("Wager must be positive"),
  date: z.string().optional(), // Will be calculated from leg dates
  legs: z.array(legSchema).min(1, "At least one leg is required"),
  isBonusBet: z.boolean().default(false),
  boostPercentage: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0).max(100).optional()
  ),
  isNoSweat: z.boolean().default(false),
}).transform((data) => {
  // Auto-calculate bet type from legs
  let betType: "straight" | "same_game_parlay" | "parlay";
  if (data.legs.length === 1) {
    betType = "straight";
  } else {
    // Use gameId instead of eventName for determining same game parlay
    const uniqueGames = new Set(data.legs.map((leg) => leg.gameId).filter(Boolean));
    if (uniqueGames.size === 1) {
      betType = "same_game_parlay";
    } else {
      betType = "parlay";
    }
  }

  // Calculate bet date from leg dates (use the most future date)
  let betDate: string;
  const legDates = data.legs
    .map((leg) => leg.date)
    .filter((date): date is string => Boolean(date));
  
  if (legDates.length > 0) {
    // Sort dates descending and take the first (most future)
    betDate = legDates.sort((a, b) => b.localeCompare(a))[0];
  } else {
    // Fallback to today if no leg dates
    betDate = new Date().toISOString().split("T")[0];
  }

  const totalOdds = calculateBetOdds(data.legs);

  // Calculate payout based on modifiers
  let payout: number;
  const basePayout = data.wager * totalOdds;
  
  if (data.isBonusBet) {
    // Bonus bet: profit only (payout - wager), no stake back
    payout = basePayout - data.wager;
  } else if (data.boostPercentage && data.boostPercentage > 0) {
    // Boost: multiply by boost percentage (e.g., 40% = 1.4x)
    payout = basePayout * (1 + data.boostPercentage / 100);
  } else {
    // Normal: wager * odds
    payout = basePayout;
  }

  return {
    ...data,
    betType,
    date: betDate,
    odds: totalOdds,
    payout,
  };
});

export type BetFormData = z.infer<typeof betFormSchema>;
export type LegFormData = z.infer<typeof legSchema>;


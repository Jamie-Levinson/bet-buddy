// Simple serialization: convert Prisma Decimal to number, Date to string

import { LeagueEnum, Market, MarketQualifier } from "@prisma/client";

export type SerializedBetWithLegs = {
  id: string;
  userId: string;
  wager: number;
  payout: number;
  odds: number;
  date: string;
  result: "pending" | "win" | "loss" | "void";
  betType: string;
  isBonusBet: boolean;
  boostPercentage: number | null;
  isNoSweat: boolean;
  sportsbook: string | null;
  createdAt: string;
  updatedAt: string;
  legGroups: Array<{
    id: string;
    betId: string;
    odds: number;
    gameId: string | null;
    order: number | null;
    legs: Array<{
      id: string;
      legGroupId: string;
      description: string;
      eventName: string;
      eventDate: string;
      result: "pending" | "win" | "loss" | "void";
      createdAt: string;
      // Canonical fields
      league: LeagueEnum | null;
      gameId: string | null;
      playerId: string | null;
      teamId: string | null;
      market: Market | null;
      qualifier: MarketQualifier | null;
      threshold: number | null;
      espnEventId: string | null;
    }>;
  }>;
};

// Convert any Prisma bet object to serialized format
export function serializeBet(bet: any): SerializedBetWithLegs {

  const toNumber = (value: any): number => {
    if (value === null || value === undefined) {
      return 0;
    }
    // If it's a Decimal object (has toNumber method), use it
    if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    if (typeof value === 'number') {
      return value;
    }
    const num = Number(value);
    if (isNaN(num)) {
      return 0;
    }
    return num;
  };

  const serialized: SerializedBetWithLegs = {
    id: String(bet.id),
    userId: String(bet.userId),
    wager: toNumber(bet.wager),      
    payout: toNumber(bet.payout),    
    odds: toNumber(bet.odds),        
    date: bet.date instanceof Date ? bet.date.toISOString() : String(bet.date),    
    result: bet.result,
    betType: bet.betType,
    isBonusBet: Boolean(bet.isBonusBet),
    boostPercentage: bet.boostPercentage !== null ? toNumber(bet.boostPercentage) : null,
    isNoSweat: Boolean(bet.isNoSweat),
    sportsbook: bet.sportsbook ? String(bet.sportsbook) : null,
    createdAt: bet.createdAt instanceof Date ? bet.createdAt.toISOString() : String(bet.createdAt),  
    updatedAt: bet.updatedAt instanceof Date ? bet.updatedAt.toISOString() : String(bet.updatedAt),  
    legGroups: (bet.legGroups || []).map((group: any) => ({
      id: String(group.id),
      betId: String(group.betId),
      odds: toNumber(group.odds),
      gameId: group.gameId ? String(group.gameId) : null,
      order: group.order !== null && group.order !== undefined ? Number(group.order) : null,
      legs: (group.legs || []).map((leg: any) => ({
        id: String(leg.id),
        legGroupId: String(leg.legGroupId),
        description: String(leg.description || ""),
        eventName: String(leg.eventName || ""),
        eventDate: leg.eventDate instanceof Date ? leg.eventDate.toISOString() : String(leg.eventDate),
        result: leg.result,
        createdAt: leg.createdAt instanceof Date ? leg.createdAt.toISOString() : String(leg.createdAt),
        // Canonical fields
        league: leg.league || null,
        gameId: leg.gameId || null,
        playerId: leg.playerId || null,
        teamId: leg.teamId || null,
        market: leg.market || null,
        qualifier: leg.qualifier || null,
        threshold: leg.threshold !== null && leg.threshold !== undefined ? toNumber(leg.threshold) : null,
        espnEventId: leg.espnEventId || null,
      })),
    })),
  };
  
  return serialized;
}

export function serializeBets(bets: any[]): SerializedBetWithLegs[] {
  return bets.map(serializeBet);
}

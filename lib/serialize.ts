// Simple serialization: convert Prisma Decimal to number, Date to string

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
  createdAt: string;
  updatedAt: string;
  legs: Array<{
    id: string;
    betId: string;
    description: string;
    eventName: string;
    odds: number;
    result: "pending" | "win" | "loss" | "void";
    createdAt: string;
  }>;
};

// Convert any Prisma bet object to serialized format
// Prisma Decimal objects need .toNumber() method
export function serializeBet(bet: any): SerializedBetWithLegs {
  // Helper to convert Decimal to number (only converts if needed)
  const toNumber = (value: any): number => {
    // If it's a Decimal object (has toNumber method), use it
    if (value?.toNumber && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    // Already a number, return as-is
    return Number(value);
  };

  // Create a completely new plain object - only convert what needs converting
  const serialized: SerializedBetWithLegs = {
    id: bet.id,
    userId: bet.userId,
    wager: toNumber(bet.wager),      // Decimal → number
    payout: toNumber(bet.payout),    // Decimal → number
    odds: toNumber(bet.odds),        // Decimal → number
    date: bet.date.toISOString(),    // Date → string
    result: bet.result,
    betType: bet.betType,
    isBonusBet: bet.isBonusBet,
    boostPercentage: bet.boostPercentage,
    isNoSweat: bet.isNoSweat,
    createdAt: bet.createdAt.toISOString(),  // Date → string
    updatedAt: bet.updatedAt.toISOString(),  // Date → string
    legs: bet.legs.map((leg: any) => ({
      id: leg.id,
      betId: leg.betId,
      description: leg.description,
      eventName: leg.eventName,
      odds: toNumber(leg.odds),              // Decimal → number
      result: leg.result,
      createdAt: leg.createdAt.toISOString(), // Date → string
    })),
  };
  
  return serialized;
}

export function serializeBets(bets: any[]): SerializedBetWithLegs[] {
  return bets.map(serializeBet);
}

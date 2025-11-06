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
    eventDate: string;
    odds: number;
    result: "pending" | "win" | "loss" | "void";
    createdAt: string;
  }>;
};

// Convert any Prisma bet object to serialized format
export function serializeBet(bet: any): SerializedBetWithLegs {

  const toNumber = (value: any): number => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return 0;
    }
    // If it's a Decimal object (has toNumber method), use it
    if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    // If it's already a number, return it
    if (typeof value === 'number') {
      return value;
    }
    // Try to convert to number
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
    createdAt: bet.createdAt instanceof Date ? bet.createdAt.toISOString() : String(bet.createdAt),  
    updatedAt: bet.updatedAt instanceof Date ? bet.updatedAt.toISOString() : String(bet.updatedAt),  
    legs: bet.legs.map((leg: any) => ({
      id: String(leg.id),
      betId: String(leg.betId),
      description: String(leg.description),
      eventName: String(leg.eventName),
      eventDate: leg.eventDate instanceof Date ? leg.eventDate.toISOString() : String(leg.eventDate),
      odds: toNumber(leg.odds),              
      result: leg.result,
      createdAt: leg.createdAt instanceof Date ? leg.createdAt.toISOString() : String(leg.createdAt), 
    })),
  };
  
  return serialized;
}

export function serializeBets(bets: any[]): SerializedBetWithLegs[] {
  return bets.map(serializeBet);
}

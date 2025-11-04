import type { Bet, Leg } from "@prisma/client";

type BetWithLegs = Bet & {
  legs: Leg[];
};

export type SerializedBet = Omit<Bet, "wager" | "payout" | "odds"> & {
  wager: number;
  payout: number;
  odds: number;
};

export type SerializedLeg = Omit<Leg, "odds"> & {
  odds: number;
};

export type SerializedBetWithLegs = SerializedBet & {
  legs: SerializedLeg[];
};

export function serializeBet(bet: BetWithLegs): SerializedBetWithLegs {
  return {
    ...bet,
    wager: Number(bet.wager),
    payout: Number(bet.payout),
    odds: Number(bet.odds),
    legs: bet.legs.map((leg) => ({
      ...leg,
      odds: Number(leg.odds),
    })),
  };
}

export function serializeBets(bets: BetWithLegs[]): SerializedBetWithLegs[] {
  return bets.map(serializeBet);
}


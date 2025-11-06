import { z } from "zod";
import { calculateBetOdds } from "@/lib/bet-helpers";

export const legSchema = z.object({
  description: z.string().min(1, "Description is required"),
  eventName: z.string().min(1, "Event name is required"),
  odds: z.coerce.number().min(1.01, "Odds must be greater than 1"),
  result: z.enum(["pending", "win", "loss", "void"] as const).default("pending"),
});

export const betFormSchema = z.object({
  betType: z.enum(["straight", "same_game_parlay", "parlay"] as const).optional(),
  wager: z.coerce.number().positive("Wager must be positive"),
  date: z.string().min(1, "Date is required"),
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
    const uniqueEvents = new Set(data.legs.map((leg) => leg.eventName));
    if (uniqueEvents.size === 1) {
      betType = "same_game_parlay";
    } else {
      betType = "parlay";
    }
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
    odds: totalOdds,
    payout,
  };
});

export type BetFormData = z.infer<typeof betFormSchema>;
export type LegFormData = z.infer<typeof legSchema>;


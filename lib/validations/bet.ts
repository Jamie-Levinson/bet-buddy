import { z } from "zod";

export const legSchema = z.object({
  description: z.string().min(1, "Description is required"),
  eventName: z.string().min(1, "Event name is required"),
  odds: z.coerce.number().positive("Odds must be positive"),
  result: z.enum(["win", "loss", "void"] as const),
});

export const betFormSchema = z.object({
  betType: z.enum(["straight", "same_game_parlay", "parlay"] as const),
  wager: z.coerce.number().positive("Wager must be positive"),
  payout: z.coerce.number().positive("Payout must be positive"),
  odds: z.coerce.number().positive("Odds must be positive"),
  date: z.string().min(1, "Date is required"),
  result: z.enum(["win", "loss", "void"] as const),
  legs: z.array(legSchema).min(1, "At least one leg is required"),
  isBonusBet: z.boolean().default(false),
  boostPercentage: z.coerce.number().int().min(0).max(100).optional(),
  isNoSweat: z.boolean().default(false),
});

export type BetFormData = z.infer<typeof betFormSchema>;
export type LegFormData = z.infer<typeof legSchema>;


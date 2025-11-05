"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { revalidatePath } from "next/cache";
import { serializeBet, serializeBets, type SerializedBetWithLegs } from "@/lib/serialize";

export async function createBet(data: BetFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = betFormSchema.parse(data);

  const bet = await prisma.bet.create({
    data: {
      userId: user.id,
      wager: validated.wager,
      payout: validated.payout,
      odds: validated.odds,
      date: new Date(validated.date),
      result: validated.result,
      betType: validated.betType!,
      isBonusBet: validated.isBonusBet,
      boostPercentage: validated.boostPercentage ?? null,
      isNoSweat: validated.isNoSweat,
      legs: {
        create: validated.legs.map((leg) => ({
          description: leg.description,
          eventName: leg.eventName,
          odds: leg.odds,
          result: "pending" as const,
        })),
      },
    },
    include: {
      legs: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  return bet;
}

export async function getBets(page = 1, pageSize = 20) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const skip = (page - 1) * pageSize;

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where: {
        userId: user.id,
      },
      include: {
        legs: true,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.bet.count({
      where: {
        userId: user.id,
      },
    }),
  ]);

  // Serialize immediately to convert Decimal to number
  const serializedBets = serializeBets(bets);

  return {
    bets: serializedBets,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBet(id: string): Promise<SerializedBetWithLegs> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const bet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      legs: true,
    },
  });

  if (!bet) {
    throw new Error("Bet not found");
  }

  // Serialize immediately to convert Decimal to number
  return serializeBet(bet);
}

export async function updateBet(id: string, data: BetFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = betFormSchema.parse(data);

  // Verify ownership
  const existingBet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingBet) {
    throw new Error("Bet not found");
  }

  const bet = await prisma.bet.update({
    where: {
      id,
    },
    data: {
      wager: validated.wager,
      payout: validated.payout,
      odds: validated.odds,
      date: new Date(validated.date),
      result: validated.result,
      betType: validated.betType!,
      isBonusBet: validated.isBonusBet,
      boostPercentage: validated.boostPercentage ?? null,
      isNoSweat: validated.isNoSweat,
      legs: {
        deleteMany: {},
        create: validated.legs.map((leg) => ({
          description: leg.description,
          eventName: leg.eventName,
          odds: leg.odds,
          result: "pending" as const,
        })),
      },
    },
    include: {
      legs: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath(`/bets/${id}`);
  
  // Serialize before returning
  return serializeBet(bet);
}

export async function updateBetResult(id: string, result: "pending" | "win" | "loss" | "void") {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const existingBet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingBet) {
    throw new Error("Bet not found");
  }

  await prisma.bet.update({
    where: {
      id,
    },
    data: {
      result,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  revalidatePath(`/bets/${id}`);
}

export async function deleteBet(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership
  const existingBet = await prisma.bet.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existingBet) {
    throw new Error("Bet not found");
  }

  await prisma.bet.delete({
    where: {
      id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
}

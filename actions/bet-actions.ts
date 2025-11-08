"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { revalidatePath } from "next/cache";
import { serializeBet, serializeBets, type SerializedBetWithLegs } from "@/lib/serialize";
import { calculateBetResult, calculateBetOdds } from "@/lib/bet-helpers";
import { formatMarketDisplay } from "@/lib/market-helpers";

async function buildLegPayload(leg: BetFormData["legs"][number]) {
  const game = await prisma.game.findUnique({
    where: { id: leg.gameId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!game) {
    throw new Error(`Game not found: ${leg.gameId}`);
  }

  const eventName = `${game.awayTeam.name} vs ${game.homeTeam.name}`;

  const player = leg.playerId
    ? await prisma.player.findUnique({
        where: { id: leg.playerId },
      })
    : null;

  const team = leg.teamId
    ? await prisma.team.findUnique({
        where: { id: leg.teamId },
      })
    : null;

  const description = formatMarketDisplay(
    leg.market,
    player?.fullName,
    team?.name,
    leg.qualifier || undefined,
    leg.threshold || undefined
  );

  return {
    league: leg.league,
    gameId: leg.gameId,
    market: leg.market,
    playerId: leg.playerId || null,
    teamId: leg.teamId || null,
    qualifier: leg.qualifier || null,
    threshold: leg.threshold || null,
    espnEventId: game.espnEventId,
    description,
    eventName,
    eventDate: game.startTime,
    odds: leg.odds,
    result: leg.result,
  };
}

export async function createBet(data: BetFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = betFormSchema.parse(data);

  const betResult = calculateBetResult(validated.legs);
  const calculatedOdds = calculateBetOdds(validated.legs);

  const legData = await Promise.all(validated.legs.map(buildLegPayload));

  const bet = await prisma.bet.create({
    data: {
      userId: user.id,
      wager: validated.wager,
      payout: validated.payout,
      odds: calculatedOdds,
      date: new Date(validated.date),
      result: betResult,
      betType: validated.betType!,
      isBonusBet: validated.isBonusBet,
      boostPercentage: validated.boostPercentage ?? null,
      isNoSweat: validated.isNoSweat,
      legs: {
        create: legData,
      },
    },
    include: {
      legs: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  
  // Serialize before returning
  return serializeBet(bet);
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
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
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

  const betResult = calculateBetResult(validated.legs);
  const calculatedOdds = calculateBetOdds(validated.legs);

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

  const legData = await Promise.all(validated.legs.map(buildLegPayload));

  const bet = await prisma.bet.update({
    where: {
      id,
    },
    data: {
      wager: validated.wager,
      payout: validated.payout,
      odds: calculatedOdds,
      date: new Date(validated.date),
      result: betResult,
      betType: validated.betType!,
      isBonusBet: validated.isBonusBet,
      boostPercentage: validated.boostPercentage ?? null,
      isNoSweat: validated.isNoSweat,
      legs: {
        deleteMany: {},
        create: legData,
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

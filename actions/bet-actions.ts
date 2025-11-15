"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { revalidatePath } from "next/cache";
import { serializeBet, serializeBets, type SerializedBetWithLegs } from "@/lib/serialize";
import { calculateBetResultFromGroups, calculateBetOddsFromGroups } from "@/lib/bet-helpers";
import { formatMarketDisplay } from "@/lib/market-helpers";

async function buildLegPayload(leg: BetFormData["legGroups"][number]["legs"][number], gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
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
    gameId: gameId,
    market: leg.market,
    playerId: leg.playerId || null,
    teamId: leg.teamId || null,
    qualifier: leg.qualifier || null,
    threshold: leg.threshold || null,
    espnEventId: game.espnEventId,
    description,
    eventName,
    eventDate: game.startTime,
    result: leg.result,
  };
}

export async function createBet(data: BetFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = betFormSchema.parse(data);

  // Calculate bet result from all legs in all groups
  const betResult = calculateBetResultFromGroups(
    validated.legGroups.map((group) => ({
      legs: group.legs.map((leg) => ({ result: leg.result })),
    }))
  );
  const calculatedOdds = calculateBetOddsFromGroups(
    validated.legGroups.map((group) => ({ odds: group.odds }))
  );

  // Create leg groups with their legs
  const legGroupsData = await Promise.all(
    validated.legGroups.map(async (group, groupIndex) => {
      // Determine gameId for the group (use first leg's gameId)
      const groupGameId = group.gameId || group.legs[0]?.gameId;
      if (!groupGameId) {
        throw new Error(`Group ${groupIndex} must have a gameId or legs with gameId`);
      }

      const legsData = await Promise.all(
        group.legs.map((leg) => buildLegPayload(leg, groupGameId))
      );

      return {
        odds: group.odds,
        gameId: groupGameId,
        order: group.order ?? groupIndex,
        legs: {
          create: legsData,
        },
      };
    })
  );

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
      legGroups: {
        create: legGroupsData,
      },
    },
    include: {
      legGroups: {
        include: {
          legs: true,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bets");
  
  // Serialize before returning
  return serializeBet(bet);
}

export async function getBets(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        wager: true,
        payout: true,
        odds: true,
        date: true,
        result: true,
        betType: true,
        isBonusBet: true,
        boostPercentage: true,
        isNoSweat: true,
        createdAt: true,
        updatedAt: true,
        legGroups: {
          select: {
            id: true,
            odds: true,
            gameId: true,
            order: true,
            legs: {
              select: {
                id: true,
                description: true,
                eventName: true,
                eventDate: true,
                result: true,
                league: true,
                market: true,
                playerId: true,
                teamId: true,
                qualifier: true,
                threshold: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
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
        userId,
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
      legGroups: {
        include: {
          legs: true,
        },
        orderBy: {
          order: "asc",
        },
      },
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

  // Calculate bet result from all legs in all groups
  const betResult = calculateBetResultFromGroups(
    validated.legGroups.map((group) => ({
      legs: group.legs.map((leg) => ({ result: leg.result })),
    }))
  );
  const calculatedOdds = calculateBetOddsFromGroups(
    validated.legGroups.map((group) => ({ odds: group.odds }))
  );

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

  // Create leg groups with their legs
  const legGroupsData = await Promise.all(
    validated.legGroups.map(async (group, groupIndex) => {
      // Determine gameId for the group (use first leg's gameId)
      const groupGameId = group.gameId || group.legs[0]?.gameId;
      if (!groupGameId) {
        throw new Error(`Group ${groupIndex} must have a gameId or legs with gameId`);
      }

      const legsData = await Promise.all(
        group.legs.map((leg) => buildLegPayload(leg, groupGameId))
      );

      return {
        odds: group.odds,
        gameId: groupGameId,
        order: group.order ?? groupIndex,
        legs: {
          create: legsData,
        },
      };
    })
  );

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
      legGroups: {
        deleteMany: {},
        create: legGroupsData,
      },
    },
    include: {
      legGroups: {
        include: {
          legs: true,
        },
        orderBy: {
          order: "asc",
        },
      },
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

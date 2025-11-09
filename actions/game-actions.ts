"use server";

import { prisma } from "@/lib/prisma";
import { LeagueEnum } from "@prisma/client";
import { getUtcRangeForTimezoneDate } from "@/lib/timezone-helpers";

export interface GameWithTeams {
  id: string;
  league: LeagueEnum;
  espnEventId: string | null;
  startTime: Date;
  status: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string | null;
  };
}

export interface PlayerOption {
  id: string;
  fullName: string;
  position: string | null;
  teamId: string;
}

/**
 * Get games for a specific league and date
 */
export async function getGamesByLeagueAndDate(
  league: LeagueEnum,
  dateString: string,
  timezone: string = "America/New_York"
): Promise<GameWithTeams[]> {
  const { start, end } = getUtcRangeForTimezoneDate(dateString, timezone);

  const games = await prisma.game.findMany({
    where: {
      league,
      startTime: {
        gte: start,
        lte: end,
      },
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return games.map((game) => ({
    id: game.id,
    league: game.league,
    espnEventId: game.espnEventId,
    startTime: game.startTime,
    status: game.status,
    homeTeam: {
      id: game.homeTeam.id,
      name: game.homeTeam.name,
      abbreviation: game.homeTeam.abbreviation,
    },
    awayTeam: {
      id: game.awayTeam.id,
      name: game.awayTeam.name,
      abbreviation: game.awayTeam.abbreviation,
    },
  }));
}

/**
 * Get players for teams in a specific game
 */
export async function getPlayersByGame(gameId: string): Promise<PlayerOption[]> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: {
        include: {
          players: {
            where: {
              teamId: { not: null }, // Only players currently on a team
            },
            orderBy: {
              fullName: "asc",
            },
          },
        },
      },
      awayTeam: {
        include: {
          players: {
            where: {
              teamId: { not: null },
            },
            orderBy: {
              fullName: "asc",
            },
          },
        },
      },
    },
  });

  if (!game) {
    return [];
  }

  // Combine players from both teams
  const players: PlayerOption[] = [
    ...game.homeTeam.players.map((player) => ({
      id: player.id,
      fullName: player.fullName,
      position: player.position,
      teamId: player.teamId!,
    })),
    ...game.awayTeam.players.map((player) => ({
      id: player.id,
      fullName: player.fullName,
      position: player.position,
      teamId: player.teamId!,
    })),
  ];

  // Sort by name
  return players.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * Get players for a specific team
 */
export async function getPlayersByTeam(teamId: string): Promise<PlayerOption[]> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        where: {
          teamId: { not: null },
        },
        orderBy: {
          fullName: "asc",
        },
      },
    },
  });

  if (!team) {
    return [];
  }

  return team.players.map((player) => ({
    id: player.id,
    fullName: player.fullName,
    position: player.position,
    teamId: player.teamId!,
  }));
}


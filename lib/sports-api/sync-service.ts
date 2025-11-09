/**
 * Sync Service
 * Orchestrates syncing of teams, players, and games from ESPN API to database
 */

import { PrismaClient } from "@prisma/client";
import { getTeams, getScoreboard, formatDateForESPN, getTeamRoster } from "./espn-client";
import {
  mapESPNTeamToTeam,
  mapESPNPlayerToPlayer,
  mapESPNEventToGame,
  getTeamIdFromCompetitor,
} from "./mappers";
import { LEAGUE_MAPPING, type ESPNLeague } from "./types";

const prisma = new PrismaClient();

type LeagueEnum = "NBA" | "NFL" | "MLB" | "NHL";

/**
 * Sync all players for a league by fetching rosters for each team
 * Processes teams in batches with progress updates
 */
export async function syncPlayers(
  league: ESPNLeague,
  batchSize: number = 5
): Promise<{ created: number; updated: number; errors: number }> {
  console.log(`\n=== Syncing players for ${league.toUpperCase()} ===`);
  
  const mapping = LEAGUE_MAPPING[league];
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  try {
    // Get all teams for this league
    const teams = await prisma.team.findMany({
      where: { league: mapping.leagueEnum },
      select: { id: true, espnId: true, name: true },
    });
    
    if (teams.length === 0) {
      throw new Error(`No teams found for ${league}. Sync teams first.`);
    }
    
    console.log(`Found ${teams.length} teams. Processing in batches of ${batchSize}...\n`);
    
    // Process teams in batches
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(teams.length / batchSize);
      
      console.log(`[Batch ${batchNum}/${totalBatches}] Processing ${batch.length} teams...`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (team) => {
        if (!team.espnId) {
          console.warn(`  ⚠️  Skipping ${team.name} - no ESPN ID`);
          return;
        }
        
        try {
          const rosterData = await getTeamRoster(league, team.espnId);
          
          // Extract athletes from roster
          // Structure varies by league:
          // NBA: athletes array directly contains player objects
          // NFL/MLB/NHL: athletes array contains position groups with items array
          let athletes: any[] = [];
          if (rosterData?.athletes) {
            // Check if first athlete has items (grouped structure)
            if (rosterData.athletes[0]?.items && Array.isArray(rosterData.athletes[0].items)) {
              // Flatten grouped structure (NFL/MLB/NHL)
              athletes = rosterData.athletes.flatMap((group: any) => group.items || []);
            } else {
              // Direct structure (NBA)
              athletes = rosterData.athletes;
            }
          }
          
          if (athletes.length === 0) {
            console.warn(`  ⚠️  No players found for ${team.name}`);
            return;
          }
          
          let teamCreated = 0;
          let teamUpdated = 0;
          
          for (const athlete of athletes) {
            if (!athlete.id || !athlete.fullName) {
              continue; // Skip invalid athletes
            }
            
            const playerData = mapESPNPlayerToPlayer(athlete, league, team.id);
            
            // Check if player already exists by ESPN ID
            const existingPlayer = await prisma.player.findFirst({
              where: {
                espnId: athlete.id,
                league: mapping.leagueEnum,
              },
            });
            
            if (existingPlayer) {
              // Update existing player
              await prisma.player.update({
                where: { id: existingPlayer.id },
                data: {
                  fullName: playerData.fullName,
                  position: playerData.position,
                  ...(team.id && { team: { connect: { id: team.id } } }),
                },
              });
              teamUpdated++;
            } else {
              // Create new player
              await prisma.player.create({
                data: playerData,
              });
              teamCreated++;
            }
          }
          
          console.log(`  ✓ ${team.name}: ${teamCreated} new, ${teamUpdated} updated (${athletes.length} total)`);
          created += teamCreated;
          updated += teamUpdated;
        } catch (error) {
          console.error(`  ✗ Error syncing ${team.name}:`, error instanceof Error ? error.message : error);
          errors++;
        }
      });
      
      await Promise.all(batchPromises);
      
      // Progress update
      const progress = ((i + batch.length) / teams.length * 100).toFixed(1);
      console.log(`  Progress: ${progress}% (${i + batch.length}/${teams.length} teams)\n`);
    }
    
    console.log(`✓ Completed syncing players for ${league.toUpperCase()}`);
    console.log(`  Created: ${created}, Updated: ${updated}, Errors: ${errors}\n`);
    
    return { created, updated, errors };
  } catch (error) {
    console.error(`Error syncing players for ${league}:`, error);
    throw error;
  }
}

/**
 * Sync all teams for a league
 */
export async function syncTeams(league: ESPNLeague): Promise<{ created: number; updated: number }> {
  console.log(`Syncing teams for ${league}...`);
  
  const mapping = LEAGUE_MAPPING[league];
  let created = 0;
  let updated = 0;
  
  try {
    const response = await getTeams(league);
    const leagueData = response.sports[0]?.leagues[0];
    
    if (!leagueData) {
      throw new Error(`No league data found for ${league}`);
    }
    
    for (const teamWrapper of leagueData.teams) {
      const espnTeam = teamWrapper.team;
      const teamData = mapESPNTeamToTeam(espnTeam, league);
      
      // Check if team already exists by ESPN ID AND league (ESPN IDs can overlap between leagues)
      const existingTeam = await prisma.team.findFirst({
        where: {
          espnId: espnTeam.id,
          league: mapping.leagueEnum,
        },
      });
      
      if (existingTeam) {
        // Update existing team (only update name/abbreviation/location, not league)
        await prisma.team.update({
          where: { id: existingTeam.id },
          data: {
            name: teamData.name,
            abbreviation: teamData.abbreviation,
            location: teamData.location,
          },
        });
        updated++;
      } else {
        // Create new team
        await prisma.team.create({
          data: teamData,
        });
        created++;
      }
    }
    
    console.log(`✓ Synced ${created} new teams, ${updated} updated teams for ${league}`);
    return { created, updated };
  } catch (error) {
    console.error(`Error syncing teams for ${league}:`, error);
    throw error;
  }
}

/**
 * Sync games for a date range
 */
export async function syncGames(
  league: ESPNLeague,
  startDate: Date,
  endDate: Date
): Promise<{ created: number; updated: number }> {
  console.log(`Syncing games for ${league} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
  
  const mapping = LEAGUE_MAPPING[league];
  let created = 0;
  let updated = 0;
  
  try {
    // Get all teams for this league to build ESPN ID -> DB ID mapping
    const teams = await prisma.team.findMany({
      where: { league: mapping.leagueEnum },
    });
    
    const teamsByEspnId = new Map<string, string>();
    teams.forEach((team) => {
      if (team.espnId) {
        teamsByEspnId.set(team.espnId, team.id);
      }
    });
    
    if (teamsByEspnId.size === 0) {
      throw new Error(`No teams found for ${league}. Sync teams first.`);
    }
    
    // Generate date range and fetch scoreboard for each date
    // ESPN API may not accept comma-separated dates, so we'll fetch individually
    const currentDate = new Date(startDate);
    const actualEndDate = new Date(endDate);
    
    // Don't sync future dates - only go up to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const finalEndDate = actualEndDate > yesterday ? yesterday : actualEndDate;
    
    const totalDays = Math.ceil((finalEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`Total days to sync: ${totalDays}\n`);
    
    let dayCount = 0;
    
    while (currentDate <= finalEndDate) {
      dayCount++;
      const dateString = formatDateForESPN(currentDate);
      
      // Progress update every 10 days
      if (dayCount % 10 === 0 || dayCount === totalDays) {
        const progress = ((dayCount / totalDays) * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${dayCount}/${totalDays} days) - Processing ${dateString}...`);
      }
      
      try {
        const response = await getScoreboard(league, dateString);
        
        // Process each event
        for (const event of response.events) {
          const competition = event.competitions?.[0];
          if (!competition) {
            continue;
          }
          
          // Only process completed games
          if (!competition.status.type.completed) {
            continue;
          }
          
          // Find home and away teams
          const homeCompetitor = competition.competitors.find((c) => c.homeAway === "home");
          const awayCompetitor = competition.competitors.find((c) => c.homeAway === "away");
          
          if (!homeCompetitor || !awayCompetitor) {
            continue;
          }
          
          const homeTeamId = getTeamIdFromCompetitor(homeCompetitor, teamsByEspnId);
          const awayTeamId = getTeamIdFromCompetitor(awayCompetitor, teamsByEspnId);
          
          if (!homeTeamId || !awayTeamId) {
            continue;
          }
          
          const gameData = mapESPNEventToGame(event, league, homeTeamId, awayTeamId);
          
          // Check if game already exists by ESPN event ID
          const existingGame = await prisma.game.findUnique({
            where: { espnEventId: event.id },
          });
          
          if (existingGame) {
            // Update existing game
            await prisma.game.update({
              where: { id: existingGame.id },
              data: {
                startTime: gameData.startTime,
                status: gameData.status,
                homeScore: gameData.homeScore,
                awayScore: gameData.awayScore,
                wentToOvertime: gameData.wentToOvertime,
                homePeriodScores: gameData.homePeriodScores,
                awayPeriodScores: gameData.awayPeriodScores,
              },
            });
            updated++;
          } else {
            // Create new game
            await prisma.game.create({
              data: gameData,
            });
            created++;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch scoreboard for ${dateString}:`, error instanceof Error ? error.message : error);
        // Continue with next date even if one fails
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`\n✓ Completed syncing games for ${league}`);
    console.log(`  Created: ${created}, Updated: ${updated}\n`);
    
    return { created, updated };
  } catch (error) {
    console.error(`Error syncing games for ${league}:`, error);
    throw error;
  }
}

/**
 * Sync players from a competition
 */
async function syncPlayersFromCompetition(
  players: Array<{ id: string; fullName: string; position?: { abbreviation: string }; team?: { id: string } }>,
  league: ESPNLeague,
  teamsByEspnId: Map<string, string>
): Promise<void> {
  const mapping = LEAGUE_MAPPING[league];
  
  for (const espnPlayer of players) {
    const teamId = espnPlayer.team?.id ? teamsByEspnId.get(espnPlayer.team.id) : undefined;
    
    const playerData = mapESPNPlayerToPlayer(espnPlayer as any, league, teamId);
    
    // Check if player already exists by ESPN ID
    const existingPlayer = await prisma.player.findUnique({
      where: { espnId: espnPlayer.id },
    });
    
    if (existingPlayer) {
      // Update existing player
      await prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          fullName: playerData.fullName,
          position: playerData.position,
          ...(teamId && { team: { connect: { id: teamId } } }),
        },
      });
    } else {
      // Create new player
      await prisma.player.create({
        data: playerData,
      });
    }
  }
}

/**
 * Find the most recent game with status "final" for a league
 */
export async function findLastFinalGame(league: LeagueEnum): Promise<Date | null> {
  const game = await prisma.game.findFirst({
    where: { league, status: "final" },
    orderBy: { startTime: "desc" },
  });
  return game ? game.startTime : null;
}

/**
 * Find the first game with status "scheduled" after a given date
 * Returns the game's startTime, or date + 1 day if no scheduled game found
 */
export async function findFirstScheduledAfter(league: LeagueEnum, date: Date): Promise<Date> {
  const game = await prisma.game.findFirst({
    where: { league, status: "scheduled", startTime: { gt: date } },
    orderBy: { startTime: "asc" },
  });
  return game ? game.startTime : new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Get all teams that have games scheduled for tomorrow
 */
export async function getTeamsPlayingTomorrow(league: LeagueEnum): Promise<Array<{ id: string; espnId: string | null }>> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  const games = await prisma.game.findMany({
    where: {
      league,
      status: "scheduled",
      startTime: { gte: tomorrow, lt: dayAfter },
    },
    select: { homeTeamId: true, awayTeamId: true },
  });
  
  const teamIds = new Set<string>();
  games.forEach((game: { homeTeamId: string; awayTeamId: string }) => {
    teamIds.add(game.homeTeamId);
    teamIds.add(game.awayTeamId);
  });
  
  const teams = await prisma.team.findMany({
    where: { id: { in: Array.from(teamIds) } },
    select: { id: true, espnId: true },
  });
  
  return teams;
}

/**
 * Sync roster for a single team and update player team assignments
 * Returns stats about players moved, added, and removed
 */
export async function syncTeamRoster(
  league: ESPNLeague,
  teamEspnId: string
): Promise<{ playersMoved: number; playersAdded: number; playersRemoved: number }> {
  const mapping = LEAGUE_MAPPING[league];
  let playersMoved = 0;
  let playersAdded = 0;
  let playersRemoved = 0;
  
  try {
    // Get team record from DB
    const team = await prisma.team.findFirst({
      where: { espnId: teamEspnId, league: mapping.leagueEnum },
    });
    
    if (!team) {
      throw new Error(`Team not found for ESPN ID ${teamEspnId}`);
    }
    
    // Fetch current roster from ESPN API
    const rosterData = await getTeamRoster(league, teamEspnId);
    
    // Extract athletes from roster (handle nested structure)
    let athletes: any[] = [];
    if (rosterData?.athletes) {
      // Check if first athlete has items (grouped structure)
      if (rosterData.athletes[0]?.items && Array.isArray(rosterData.athletes[0].items)) {
        // Flatten grouped structure (NFL/MLB/NHL)
        athletes = rosterData.athletes.flatMap((group: any) => group.items || []);
      } else {
        // Direct structure (NBA)
        athletes = rosterData.athletes;
      }
    }
    
    const currentPlayerEspnIds = new Set<string>();
    
    // Process each player in roster
    for (const athlete of athletes) {
      if (!athlete.id || !athlete.fullName) {
        continue; // Skip invalid athletes
      }
      
      currentPlayerEspnIds.add(athlete.id);
      
      const playerData = mapESPNPlayerToPlayer(athlete, league, team.id);
      
      // Check if player already exists by ESPN ID
      const existingPlayer = await prisma.player.findUnique({
        where: { espnId: athlete.id },
      });
      
      if (existingPlayer) {
        // Check if team changed (trade detected)
        if (existingPlayer.teamId !== team.id) {
          await prisma.player.update({
            where: { id: existingPlayer.id },
            data: {
              teamId: team.id,
              position: playerData.position,
            },
          });
          playersMoved++;
        } else {
          // Update position if changed
          if (existingPlayer.position !== playerData.position) {
            await prisma.player.update({
              where: { id: existingPlayer.id },
              data: { position: playerData.position },
            });
          }
        }
      } else {
        // Create new player
        await prisma.player.create({
          data: playerData,
        });
        playersAdded++;
      }
    }
    
    // Check for players removed from roster (set teamId to null)
    const removedPlayers = await prisma.player.updateMany({
      where: {
        teamId: team.id,
        league: mapping.leagueEnum,
        espnId: { notIn: Array.from(currentPlayerEspnIds) },
      },
      data: { teamId: null },
    });
    
    playersRemoved = removedPlayers.count;
    
    return { playersMoved, playersAdded, playersRemoved };
  } catch (error) {
    console.error(`Error syncing roster for team ${teamEspnId}:`, error);
    throw error;
  }
}



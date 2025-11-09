/**
 * Daily Sync Script
 * 
 * This script runs daily to:
 * 1. Update past scores (from last final game to today)
 * 2. Update rosters for teams playing tomorrow
 * 
 * Run with: npm run sync:daily
 */

import { PrismaClient } from "@prisma/client";
import {
  findLastFinalGame,
  findFirstScheduledAfter,
  getTeamsPlayingTomorrow,
  syncTeamRoster,
  syncGames,
} from "../lib/sports-api/sync-service";
import { LEAGUE_MAPPING } from "../lib/sports-api/types";

const prisma = new PrismaClient();

type LeagueEnum = "NBA" | "NFL" | "NHL";

const LEAGUES: LeagueEnum[] = ["NBA", "NFL", "NHL"];

interface SyncSummary {
  league: LeagueEnum;
  gamesCreated: number;
  gamesUpdated: number;
  playersMoved: number;
  playersAdded: number;
  playersRemoved: number;
  errors: number;
}

/**
 * Part A: Update Past Scores
 */
async function updatePastScores(league: LeagueEnum): Promise<{ created: number; updated: number; errors: number }> {
  console.log(`\n=== Updating past scores for ${league} ===`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  try {
    // Find the most recent game with status "final"
    const lastFinalGame = await findLastFinalGame(league);
    
    if (!lastFinalGame) {
      console.log(`  No final games found for ${league}. Skipping score updates.`);
      return { created, updated, errors };
    }
    
    // Find the first game with status "scheduled" after that (or use final game's date + 1 day)
    const startDate = await findFirstScheduledAfter(league, lastFinalGame);
    
    // Sync games from that date to today
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    console.log(`  Syncing games from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}...`);
    
    const leagueMap: Record<LeagueEnum, "nba" | "nfl" | "nhl"> = {
      NBA: "nba",
      NFL: "nfl",
      NHL: "nhl",
    };
    
    const result = await syncGames(leagueMap[league], startDate, today);
    created = result.created;
    updated = result.updated;
    
    console.log(`  ✓ Updated scores: ${created} created, ${updated} updated`);
  } catch (error) {
    console.error(`  ✗ Error updating scores for ${league}:`, error instanceof Error ? error.message : error);
    errors++;
  }
  
  return { created, updated, errors };
}

/**
 * Part B: Update Rosters for Teams Playing Tomorrow
 */
async function updateRosters(league: LeagueEnum): Promise<{ playersMoved: number; playersAdded: number; playersRemoved: number; errors: number }> {
  console.log(`\n=== Updating rosters for ${league} teams playing tomorrow ===`);
  
  let playersMoved = 0;
  let playersAdded = 0;
  let playersRemoved = 0;
  let errors = 0;
  
  try {
    // Get all teams that have games scheduled for tomorrow
    const teams = await getTeamsPlayingTomorrow(league);
    
    if (teams.length === 0) {
      console.log(`  No teams playing tomorrow for ${league}. Skipping roster updates.`);
      return { playersMoved, playersAdded, playersRemoved, errors };
    }
    
    console.log(`  Found ${teams.length} teams playing tomorrow`);
    
    const leagueMap: Record<LeagueEnum, "nba" | "nfl" | "nhl"> = {
      NBA: "nba",
      NFL: "nfl",
      NHL: "nhl",
    };
    
    // Sync roster for each team
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      
      if (!team.espnId) {
        console.warn(`  ⚠️  Skipping team ${team.id} - no ESPN ID`);
        continue;
      }
      
      try {
        const result = await syncTeamRoster(leagueMap[league], team.espnId);
        playersMoved += result.playersMoved;
        playersAdded += result.playersAdded;
        playersRemoved += result.playersRemoved;
        
        if (result.playersMoved > 0 || result.playersAdded > 0 || result.playersRemoved > 0) {
          console.log(`  [${i + 1}/${teams.length}] Team ${team.espnId}: ${result.playersMoved} moved, ${result.playersAdded} added, ${result.playersRemoved} removed`);
        }
      } catch (error) {
        console.error(`  ✗ Error syncing roster for team ${team.espnId}:`, error instanceof Error ? error.message : error);
        errors++;
        // Continue with next team
      }
    }
    
    console.log(`  ✓ Roster updates complete: ${playersMoved} moved, ${playersAdded} added, ${playersRemoved} removed`);
  } catch (error) {
    console.error(`  ✗ Error updating rosters for ${league}:`, error instanceof Error ? error.message : error);
    errors++;
  }
  
  return { playersMoved, playersAdded, playersRemoved, errors };
}

/**
 * Main sync function
 */
async function syncDaily(): Promise<void> {
  console.log("=".repeat(60));
  console.log("DAILY SYNC STARTED");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  
  const summaries: SyncSummary[] = [];
  
  // Process each league
  for (const league of LEAGUES) {
    const summary: SyncSummary = {
      league,
      gamesCreated: 0,
      gamesUpdated: 0,
      playersMoved: 0,
      playersAdded: 0,
      playersRemoved: 0,
      errors: 0,
    };
    
    try {
      // Part A: Update past scores
      const scoresResult = await updatePastScores(league);
      summary.gamesCreated = scoresResult.created;
      summary.gamesUpdated = scoresResult.updated;
      summary.errors += scoresResult.errors;
      
      // Part B: Update rosters
      const rostersResult = await updateRosters(league);
      summary.playersMoved = rostersResult.playersMoved;
      summary.playersAdded = rostersResult.playersAdded;
      summary.playersRemoved = rostersResult.playersRemoved;
      summary.errors += rostersResult.errors;
      
      summaries.push(summary);
    } catch (error) {
      console.error(`\n✗ Fatal error processing ${league}:`, error);
      summary.errors++;
      summaries.push(summary);
    }
  }
  
  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("DAILY SYNC SUMMARY");
  console.log("=".repeat(60));
  
  let totalGamesCreated = 0;
  let totalGamesUpdated = 0;
  let totalPlayersMoved = 0;
  let totalPlayersAdded = 0;
  let totalPlayersRemoved = 0;
  let totalErrors = 0;
  
  for (const summary of summaries) {
    console.log(`\n${summary.league}:`);
    console.log(`  Games: ${summary.gamesCreated} created, ${summary.gamesUpdated} updated`);
    console.log(`  Players: ${summary.playersMoved} moved, ${summary.playersAdded} added, ${summary.playersRemoved} removed`);
    if (summary.errors > 0) {
      console.log(`  Errors: ${summary.errors}`);
    }
    
    totalGamesCreated += summary.gamesCreated;
    totalGamesUpdated += summary.gamesUpdated;
    totalPlayersMoved += summary.playersMoved;
    totalPlayersAdded += summary.playersAdded;
    totalPlayersRemoved += summary.playersRemoved;
    totalErrors += summary.errors;
  }
  
  console.log("\n" + "-".repeat(60));
  console.log("TOTALS:");
  console.log(`  Games: ${totalGamesCreated} created, ${totalGamesUpdated} updated`);
  console.log(`  Players: ${totalPlayersMoved} moved, ${totalPlayersAdded} added, ${totalPlayersRemoved} removed`);
  if (totalErrors > 0) {
    console.log(`  Errors: ${totalErrors}`);
  }
  console.log("=".repeat(60));
  
  console.log("\n✓ Daily sync completed successfully!");
}

// Run the sync
syncDaily()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Fatal error in daily sync:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });


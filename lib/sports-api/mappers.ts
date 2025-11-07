/**
 * Mapper functions to transform ESPN API responses to our database models
 */

import type {
  ESPNTeam,
  ESPNAthlete,
  ESPNEvent,
  ESPNCompetition,
  ESPNCompetitor,
  ESPNLeague,
} from "./types";
import { LEAGUE_MAPPING } from "./types";

// Use Prisma's generated types - these will be available after Prisma client generation
type TeamCreateInput = {
  league: "NBA" | "NFL" | "MLB" | "NHL";
  name: string;
  abbreviation: string | null;
  location: string | null;
  espnId: string;
};

type PlayerCreateInput = {
  league: "NBA" | "NFL" | "MLB" | "NHL";
  fullName: string;
  position: string | null;
  espnId: string;
  team?: { connect: { id: string } };
};

type GameCreateInput = {
  league: "NBA" | "NFL" | "MLB" | "NHL";
  espnEventId: string;
  startTime: Date;
  status: string;
  homeTeam: { connect: { id: string } };
  awayTeam: { connect: { id: string } };
  homeScore: number | null;
  awayScore: number | null;
  wentToOvertime: boolean;
  homePeriodScores?: number[];
  awayPeriodScores?: number[];
};

/**
 * Map ESPN team to our Team model
 */
export function mapESPNTeamToTeam(
  espnTeam: ESPNTeam,
  league: ESPNLeague
): TeamCreateInput {
  const mapping = LEAGUE_MAPPING[league];
  
  return {
    league: mapping.leagueEnum,
    name: espnTeam.displayName || espnTeam.name,
    abbreviation: espnTeam.abbreviation || null,
    location: espnTeam.location || null,
    espnId: espnTeam.id,
  };
}

/**
 * Map ESPN athlete/player to our Player model
 */
export function mapESPNPlayerToPlayer(
  espnPlayer: ESPNAthlete,
  league: ESPNLeague,
  teamId?: string
): PlayerCreateInput {
  const mapping = LEAGUE_MAPPING[league];
  
          // Handle different position formats:
          // NBA/NHL: position.abbreviation (e.g., "F", "G")
          // NFL/MLB: position is a string (e.g., "offense", "Pitchers")
          let position: string | null = null;
          if (espnPlayer.position) {
            if (typeof espnPlayer.position === "string") {
              position = espnPlayer.position;
            } else if (espnPlayer.position.abbreviation) {
              position = espnPlayer.position.abbreviation;
            } else if ((espnPlayer.position as any).name) {
              position = (espnPlayer.position as any).name;
            }
          }
  
  return {
    league: mapping.leagueEnum,
    fullName: espnPlayer.fullName,
    position,
    espnId: espnPlayer.id,
    ...(teamId && { team: { connect: { id: teamId } } }),
  };
}

/**
 * Map ESPN event to our Game model
 * Requires homeTeamId and awayTeamId to be resolved from Team records
 */
export function mapESPNEventToGame(
  espnEvent: ESPNEvent,
  league: ESPNLeague,
  homeTeamId: string,
  awayTeamId: string
): GameCreateInput {
  const mapping = LEAGUE_MAPPING[league];
  
  // Get the main competition (usually the first one)
  const competition = espnEvent.competitions?.[0];
  if (!competition) {
    throw new Error(`No competition found in ESPN event ${espnEvent.id}`);
  }
  
  // Determine status from competition status
  const status = getGameStatus(competition.status);
  
  // Parse scores from competitors
  const homeCompetitor = competition.competitors.find((c) => c.homeAway === "home");
  const awayCompetitor = competition.competitors.find((c) => c.homeAway === "away");
  
  if (!homeCompetitor || !awayCompetitor) {
    throw new Error(`Missing home/away competitors in event ${espnEvent.id}`);
  }
  
  const homeScore = homeCompetitor?.score ? parseInt(homeCompetitor.score, 10) : null;
  const awayScore = awayCompetitor?.score ? parseInt(awayCompetitor.score, 10) : null;
  
  // Use competition date if available, otherwise use event date
  const startTime = competition.date || espnEvent.date;
  
  // Extract period scores from linescores
  const homeLinescores = homeCompetitor.linescores || [];
  const awayLinescores = awayCompetitor.linescores || [];
  
  // Determine regulation periods based on league
  const regulationPeriods = league === "nhl" ? 3 : 4; // NHL has 3 periods, NBA/NFL have 4 quarters
  
  // Check if game went to overtime (more periods than regulation)
  const wentToOvertime = homeLinescores.length > regulationPeriods || awayLinescores.length > regulationPeriods;
  
  // Extract period scores as arrays
  const homePeriodScores = homeLinescores.length > 0 
    ? homeLinescores.map((ls: any) => ls.value || parseInt(ls.displayValue, 10) || 0)
    : undefined;
  const awayPeriodScores = awayLinescores.length > 0
    ? awayLinescores.map((ls: any) => ls.value || parseInt(ls.displayValue, 10) || 0)
    : undefined;
  
  return {
    league: mapping.leagueEnum,
    espnEventId: espnEvent.id,
    startTime: new Date(startTime),
    status,
    homeTeam: { connect: { id: homeTeamId } },
    awayTeam: { connect: { id: awayTeamId } },
    homeScore: homeScore !== null && !isNaN(homeScore) ? homeScore : null,
    awayScore: awayScore !== null && !isNaN(awayScore) ? awayScore : null,
    wentToOvertime: wentToOvertime || false,
    homePeriodScores,
    awayPeriodScores,
  };
}

/**
 * Get team ID from ESPN competitor
 */
export function getTeamIdFromCompetitor(
  competitor: ESPNCompetitor,
  teamsByEspnId: Map<string, string>
): string | null {
  return teamsByEspnId.get(competitor.team.id) || null;
}

/**
 * Determine game status from ESPN status
 */
function getGameStatus(status: { type: { name: string; state: string; completed: boolean } }): string {
  const statusName = status.type.name;
  const state = status.type.state;
  const completed = status.type.completed;
  
  if (completed || state === "post") {
    return "final";
  }
  
  if (state === "in") {
    return "in_progress";
  }
  
  if (statusName.includes("SCHEDULED") || state === "pre") {
    return "scheduled";
  }
  
  // Default fallback
  return statusName.toLowerCase().replace("status_", "").replace(/_/g, "_");
}



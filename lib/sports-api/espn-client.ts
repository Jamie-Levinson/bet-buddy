/**
 * ESPN API Client
 * Fetches data from ESPN's unofficial API endpoints with rate limiting and error handling
 */

import type {
  ESPNLeague,
  ESPNSport,
  ESPNTeamsResponse,
  ESPNScoreboardResponse,
} from "./types";

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

// Rate limiting: 1 second delay between requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "BetBuddy/1.0",
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText} for ${url}`);
  }
  
  return response;
}

/**
 * Get all teams for a league
 */
export async function getTeams(league: ESPNLeague): Promise<ESPNTeamsResponse> {
  const sport = getSportForLeague(league);
  const url = `${BASE_URL}/${sport}/${league}/teams`;
  
  try {
    const response = await rateLimitedFetch(url);
    const data = await response.json();
    return data as ESPNTeamsResponse;
  } catch (error) {
    console.error(`Error fetching teams for ${league}:`, error);
    throw error;
  }
}

/**
 * Get scoreboard (games) for a league and date(s)
 * @param league - League identifier (nba, nfl, mlb, nhl)
 * @param dates - Date string in format YYYYMMDD (e.g., "20251107") or comma-separated dates
 */
export async function getScoreboard(
  league: ESPNLeague,
  dates: string
): Promise<ESPNScoreboardResponse> {
  const sport = getSportForLeague(league);
  const url = `${BASE_URL}/${sport}/${league}/scoreboard?dates=${dates}`;
  
  try {
    const response = await rateLimitedFetch(url);
    const data = await response.json();
    return data as ESPNScoreboardResponse;
  } catch (error) {
    console.error(`Error fetching scoreboard for ${league} on ${dates}:`, error);
    throw error;
  }
}

/**
 * Get roster for a specific team
 * @param league - League identifier (nba, nfl, mlb, nhl)
 * @param teamId - ESPN team ID (string format)
 */
export async function getTeamRoster(
  league: ESPNLeague,
  teamId: string
): Promise<any> {
  const sport = getSportForLeague(league);
  const url = `${BASE_URL}/${sport}/${league}/teams/${teamId}/roster`;
  
  try {
    const response = await rateLimitedFetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching roster for ${league} team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Helper function to map league to sport
 */
function getSportForLeague(league: ESPNLeague): ESPNSport {
  const mapping: Record<ESPNLeague, ESPNSport> = {
    nba: "basketball",
    nfl: "football",
    mlb: "baseball",
    nhl: "hockey",
  };
  return mapping[league];
}

/**
 * Format date to YYYYMMDD format for ESPN API
 */
export function formatDateForESPN(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}


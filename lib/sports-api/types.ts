/**
 * TypeScript types for ESPN API responses
 * Based on actual API response structures from site.api.espn.com
 */

// League identifiers
export type ESPNLeague = "nba" | "nfl" | "mlb" | "nhl";
export type ESPNSport = "basketball" | "football" | "baseball" | "hockey";

// ESPN API Response Types

export interface ESPNLogo {
  href: string;
  alt: string;
  rel: string[];
  width: number;
  height: number;
}

export interface ESPNLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
  isHidden: boolean;
}

export interface ESPNTeam {
  id: string; // ESPN Team ID (string format)
  uid: string;
  slug: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name: string;
  nickname: string;
  location: string;
  color?: string;
  alternateColor?: string;
  isActive: boolean;
  isAllStar?: boolean;
  logos?: ESPNLogo[];
  links?: ESPNLink[];
}

export interface ESPNTeamWrapper {
  team: ESPNTeam;
}

export interface ESPNSeason {
  year: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  displayName: string;
  type: {
    id: string;
    type: number;
    name: string;
    abbreviation: string;
  };
}

export interface ESPNLeagueInfo {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  slug: string;
  season?: ESPNSeason;
  calendar?: string[]; // Array of ISO date strings
}

export interface ESPNAthlete {
  id: string; // ESPN Player ID (string format)
  fullName: string;
  displayName?: string;
  shortName?: string;
  headshot?: string;
  jersey?: string;
  position?: {
    abbreviation: string;
  };
  team?: {
    id: string;
  };
  active?: boolean;
}

export interface ESPNLeader {
  displayValue: string;
  value: number;
  athlete: ESPNAthlete;
}

export interface ESPNStatLeader {
  name: string;
  abbreviation: string;
  leaders: ESPNLeader[];
}

export interface ESPNProbable {
  name: string;
  playerId?: number;
  athlete: ESPNAthlete;
}

export interface ESPNCompetitor {
  id: string; // Team ID
  uid: string;
  type: string;
  order: number;
  homeAway: "home" | "away";
  team: ESPNTeam;
  score?: string; // Current/final score (string format)
  statistics?: unknown[]; // Team statistics
  leaders?: ESPNStatLeader[];
  probables?: ESPNProbable[];
  linescores?: Array<{
    value: number;
    displayValue: string;
    period: number;
  }>;
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address?: {
    city: string;
    state: string;
  };
}

export interface ESPNCompetition {
  id: string; // Event/Game ID
  uid: string;
  date: string; // ISO date string
  venue?: ESPNVenue;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
}

export interface ESPNStatus {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string; // "STATUS_SCHEDULED" | "STATUS_IN_PROGRESS" | "STATUS_FINAL"
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail: string;
  };
}

export interface ESPNEvent {
  id: string; // ESPN Event/Game ID (string format)
  uid: string;
  date: string; // ISO date string
  name: string;
  shortName: string;
  season?: {
    year: number;
    type: number;
    slug: string;
  };
  competitions: ESPNCompetition[];
}

// Teams API Response
export interface ESPNTeamsResponse {
  sports: Array<{
    id: string;
    uid: string;
    name: string;
    slug: string;
    leagues: Array<{
      id: string;
      uid: string;
      name: string;
      abbreviation: string;
      slug: string;
      teams: ESPNTeamWrapper[];
    }>;
  }>;
}

// Scoreboard API Response
export interface ESPNScoreboardResponse {
  leagues: ESPNLeagueInfo[];
  events: ESPNEvent[];
}

// Roster API Response (structure to be determined)
export interface ESPNRosterResponse {
  team?: {
    id: string;
    athletes?: Array<{
      id: string;
      fullName: string;
      displayName?: string;
      shortName?: string;
      headshot?: string;
      jersey?: string;
      position?: {
        abbreviation: string;
        name?: string;
      };
      team?: {
        id: string;
      };
      active?: boolean;
    }>;
  };
  [key: string]: unknown;
}

// Box Score API Response (structure to be verified)
export interface ESPNBoxScoreResponse {
  // Structure to be determined when endpoint is tested
  [key: string]: unknown;
}

// Helper type for league mapping
export type LeagueMapping = {
  [K in ESPNLeague]: {
    sport: ESPNSport;
    leagueEnum: "NBA" | "NFL" | "MLB" | "NHL";
    sportEnum: "BASKETBALL" | "FOOTBALL" | "BASEBALL" | "HOCKEY";
  };
};

export const LEAGUE_MAPPING: LeagueMapping = {
  nba: {
    sport: "basketball",
    leagueEnum: "NBA",
    sportEnum: "BASKETBALL",
  },
  nfl: {
    sport: "football",
    leagueEnum: "NFL",
    sportEnum: "FOOTBALL",
  },
  mlb: {
    sport: "baseball",
    leagueEnum: "MLB",
    sportEnum: "BASEBALL",
  },
  nhl: {
    sport: "hockey",
    leagueEnum: "NHL",
    sportEnum: "HOCKEY",
  },
};


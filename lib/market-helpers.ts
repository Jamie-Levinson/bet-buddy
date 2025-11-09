import { Market, MarketQualifier, LeagueEnum } from "@prisma/client";

/**
 * Consolidated market configuration - single source of truth
 */
interface MarketConfig {
  qualifier: MarketQualifier | null; // null = binary market, OVER/UNDER = requires qualifier
  isPlayerMarket: boolean;
  isTeamMarket: boolean; // Requires team selection (MONEYLINE, SPREAD, TEAM_*)
  isSpreadMarket: boolean; // SPREAD/PUCK_LINE/RUN_LINE - uses threshold with sign instead of qualifier+threshold
  leagues: LeagueEnum[];
  label: string; // Display name
}

const MARKET_CONFIG: Record<Market, MarketConfig> = {
  // Universal
  MONEYLINE: {
    qualifier: null,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL, LeagueEnum.MLB, LeagueEnum.NHL],
    label: "Moneyline",
  },
  SPREAD: {
    qualifier: null, // Not over/under, uses differential
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: true,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Spread",
  },
  TOTAL_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Total Points",
  },
  TEAM_TOTAL_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Team Total Points",
  },
  TEAM_FIRST_HALF_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Team First Half Points",
  },
  TEAM_FIRST_QUARTER_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Team First Quarter Points",
  },
  TEAM_FIRST_PERIOD_GOALS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Team First Period Goals",
  },
  TEAM_FIRST_INNING_SCORE: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Team First Inning Score",
  },
  TEAM_FIRST_FIVE_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Team First Five Runs",
  },
  WINNING_MARGIN: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "Winning Margin",
  },
  OVERTIME_YES_NO: {
    qualifier: null,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL, LeagueEnum.NHL],
    label: "Overtime",
  },
  TEAM_TO_SCORE_FIRST: {
    qualifier: null,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL, LeagueEnum.NHL],
    label: "Team to Score First",
  },
  TEAM_TO_SCORE_LAST: {
    qualifier: null,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL, LeagueEnum.NHL],
    label: "Team to Score Last",
  },
  BOTH_TEAMS_TO_SCORE: {
    qualifier: null,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL, LeagueEnum.NHL],
    label: "Both Teams to Score",
  },
  FIRST_TO_SCORE_X_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA, LeagueEnum.NFL],
    label: "First to Score X Points",
  },
  
  // Basketball (NBA)
  PLAYER_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Points",
  },
  PLAYER_REBOUNDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Rebounds",
  },
  PLAYER_ASSISTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Assists",
  },
  PLAYER_STEALS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Steals",
  },
  PLAYER_BLOCKS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Blocks",
  },
  PLAYER_THREES: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Three-Pointers Made",
  },
  PLAYER_PRA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Points + Rebounds + Assists",
  },
  PLAYER_PR: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Points + Rebounds",
  },
  PLAYER_PA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Points + Assists",
  },
  PLAYER_RA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Rebounds + Assists",
  },
  DOUBLE_DOUBLE: {
    qualifier: null,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Double-Double",
  },
  TRIPLE_DOUBLE: {
    qualifier: null,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Triple-Double",
  },
  PLAYER_TURNOVERS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Turnovers",
  },
  PLAYER_FANTASY_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Fantasy Points",
  },
  TEAM_TOTAL_POINTS_NBA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Team Total Points",
  },
  TEAM_FIRST_HALF_POINTS_NBA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Team First Half Points",
  },
  TEAM_FIRST_QUARTER_POINTS_NBA: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NBA],
    label: "Team First Quarter Points",
  },
  
  // Football (NFL)
  PLAYER_PASSING_YARDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Passing Yards",
  },
  PLAYER_RUSHING_YARDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Rushing Yards",
  },
  PLAYER_RECEIVING_YARDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Receiving Yards",
  },
  PLAYER_RECEPTIONS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Receptions",
  },
  PLAYER_PASSING_TDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Passing TDs",
  },
  PLAYER_RUSHING_TDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Rushing TDs",
  },
  PLAYER_RECEIVING_TDS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Receiving TDs",
  },
  PLAYER_ANYTIME_TD: {
    qualifier: null,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Anytime TD",
  },
  PLAYER_FIRST_TD: {
    qualifier: null,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "First TD",
  },
  PLAYER_LONGEST_RECEPTION: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Longest Reception",
  },
  PLAYER_LONGEST_RUSH: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Longest Rush",
  },
  PLAYER_INTERCEPTIONS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Interceptions",
  },
  PLAYER_COMPLETIONS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Completions",
  },
  PLAYER_ATTEMPTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Attempts",
  },
  PLAYER_PASS_ATTEMPTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Pass Attempts",
  },
  PLAYER_PASS_COMPLETIONS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Pass Completions",
  },
  PLAYER_FIELD_GOALS_MADE: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Field Goals Made",
  },
  PLAYER_FIELD_GOALS_ATTEMPTED: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Field Goals Attempted",
  },
  PLAYER_EXTRA_POINTS_MADE: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Extra Points Made",
  },
  PLAYER_PUNTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Punts",
  },
  TEAM_TOTAL_POINTS_NFL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Team Total Points",
  },
  TEAM_FIRST_HALF_POINTS_NFL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Team First Half Points",
  },
  TEAM_FIRST_QUARTER_POINTS_NFL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NFL],
    label: "Team First Quarter Points",
  },
  
  // Baseball (MLB)
  RUN_LINE: {
    qualifier: null, // Not over/under, uses differential
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: true,
    leagues: [LeagueEnum.MLB],
    label: "Run Line",
  },
  TOTAL_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Total Runs",
  },
  PLAYER_HITS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Hits",
  },
  PLAYER_HOME_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Home Runs",
  },
  PLAYER_RBIS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "RBIs",
  },
  PLAYER_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Runs",
  },
  PLAYER_TOTAL_BASES: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Total Bases",
  },
  PLAYER_STOLEN_BASES: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Stolen Bases",
  },
  PLAYER_WALKS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Walks",
  },
  PITCHER_STRIKEOUTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Strikeouts",
  },
  PITCHER_OUTS_RECORDED: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Outs Recorded",
  },
  PITCHER_EARNED_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Earned Runs",
  },
  PITCHER_HITS_ALLOWED: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Hits Allowed",
  },
  PITCHER_WALKS_ALLOWED: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Walks Allowed",
  },
  TEAM_TOTAL_RUNS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Team Total Runs",
  },
  TEAM_FIRST_FIVE_RUNS_MLB: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Team First Five Runs",
  },
  TEAM_FIRST_INNING_SCORE_MLB: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.MLB],
    label: "Team First Inning Score",
  },
  
  // Hockey (NHL)
  PUCK_LINE: {
    qualifier: null, // Not over/under, uses differential
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: true,
    leagues: [LeagueEnum.NHL],
    label: "Puck Line",
  },
  TOTAL_GOALS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Total Goals",
  },
  PLAYER_GOALS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Goals",
  },
  PLAYER_ASSISTS_NHL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Assists",
  },
  PLAYER_POINTS_NHL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Points",
  },
  PLAYER_SHOTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Shots",
  },
  PLAYER_BLOCKS_NHL: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Blocks",
  },
  PLAYER_PIM: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Penalty Minutes",
  },
  PLAYER_POWER_PLAY_POINTS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Power Play Points",
  },
  GOALIE_SAVES: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Saves",
  },
  GOALIE_SHOTS_AGAINST: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: true,
    isTeamMarket: false,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Shots Against",
  },
  TEAM_TOTAL_GOALS: {
    qualifier: MarketQualifier.OVER,
    isPlayerMarket: false,
    isTeamMarket: true,
    isSpreadMarket: false,
    leagues: [LeagueEnum.NHL],
    label: "Team Total Goals",
  },
};

/**
 * Check if a market requires a player selection
 */
export function isPlayerMarket(market: Market): boolean {
  return MARKET_CONFIG[market].isPlayerMarket;
}

/**
 * Check if a market requires a team selection
 */
export function isTeamMarket(market: Market): boolean {
  return MARKET_CONFIG[market].isTeamMarket;
}

/**
 * Check if a market is a spread market (SPREAD, PUCK_LINE, RUN_LINE)
 * These use threshold with sign instead of qualifier+threshold
 */
export function isSpreadMarket(market: Market): boolean {
  return MARKET_CONFIG[market].isSpreadMarket;
}

/**
 * Check if a market requires a qualifier (OVER/UNDER)
 * Note: Spread markets return false as they use signed thresholds
 */
export function requiresQualifier(market: Market): boolean {
  return MARKET_CONFIG[market].qualifier !== null;
}

/**
 * Get markets available for a specific league
 */
export function getMarketsForLeague(league: LeagueEnum): Market[] {
  return Object.entries(MARKET_CONFIG)
    .filter(([_, config]) => config.leagues.includes(league))
    .map(([market]) => market as Market);
}

/**
 * Get market display label
 */
export function getMarketLabel(market: Market): string {
  return MARKET_CONFIG[market].label;
}

/**
 * Format market display string for a leg
 * Examples:
 * - "Austin Reaves Over 9.5 Rebounds"
 * - "Lakers Moneyline"
 * - "Lakers -5.5 Spread"
 * - "Over 220.5 Total Points"
 */
export function formatMarketDisplay(
  market: Market,
  playerName?: string | null,
  teamName?: string | null,
  qualifier?: MarketQualifier | null,
  threshold?: number | null
): string {
  const config = MARKET_CONFIG[market];
  const marketName = config.label;
  
  // Spread markets (SPREAD, PUCK_LINE, RUN_LINE) - use threshold with sign
  if (config.isSpreadMarket && teamName && threshold !== null && threshold !== undefined) {
    const sign = threshold >= 0 ? "+" : "";
    return `${teamName} ${sign}${threshold} ${marketName}`;
  }
  
  // Player markets with qualifier
  if (playerName && qualifier && threshold !== null && threshold !== undefined) {
    const qualifierText = qualifier === MarketQualifier.OVER ? "Over" : "Under";
    return `${playerName} ${qualifierText} ${threshold} ${marketName}`;
  }
  
  // Player markets without qualifier (binary)
  if (playerName && !qualifier) {
    return `${playerName} ${marketName}`;
  }
  
  // Team markets with qualifier
  if (teamName && qualifier && threshold !== null && threshold !== undefined) {
    const qualifierText = qualifier === MarketQualifier.OVER ? "Over" : "Under";
    return `${teamName} ${qualifierText} ${threshold} ${marketName}`;
  }
  
  // Team markets without qualifier (binary like MONEYLINE)
  if (teamName && !qualifier) {
    return `${teamName} ${marketName}`;
  }
  
  // Generic with qualifier
  if (qualifier && threshold !== null && threshold !== undefined) {
    const qualifierText = qualifier === MarketQualifier.OVER ? "Over" : "Under";
    return `${qualifierText} ${threshold} ${marketName}`;
  }
  
  // Fallback to just market name
  return marketName;
}

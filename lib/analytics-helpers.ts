import { startOfDay, subDays, startOfMonth, startOfYear } from "date-fns";
import { LeagueEnum, Market } from "@prisma/client";
import type { DateRange } from "./types/analytics";

/**
 * Calculate date range based on filter selection
 */
export function getDateRange(dateRange: DateRange): { start: Date; end: Date } | null {
  const today = startOfDay(new Date());
  
  switch (dateRange) {
    case "7d":
      return {
        start: subDays(today, 6), // Last 7 days inclusive
        end: today,
      };
    case "30d":
      return {
        start: subDays(today, 29), // Last 30 days inclusive
        end: today,
      };
    case "season":
      return getSeasonDates();
    case "all":
      return null; // No date filter
    default:
      return {
        start: subDays(today, 29),
        end: today,
      };
  }
}

/**
 * Get current season dates based on current date
 * NBA: Oct/Nov to Apr/May/June
 * NFL: Sep to Feb
 * NHL: Oct to Apr/May/June
 * MLB: Mar/Apr to Oct/Nov
 * 
 * For simplicity, we'll use a common season window (Oct to June)
 * This can be refined later to be sport-specific
 */
export function getSeasonDates(): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  // If we're in Jan-Sep, season started in previous year's Oct
  // If we're in Oct-Dec, season started this year's Oct
  let seasonStartYear = currentYear;
  if (currentMonth < 9) { // Before October
    seasonStartYear = currentYear - 1;
  }
  
  const seasonStart = new Date(seasonStartYear, 9, 1); // October 1
  const seasonEnd = new Date(seasonStartYear + 1, 5, 30); // June 30 of next year
  
  return {
    start: startOfDay(seasonStart),
    end: startOfDay(seasonEnd > now ? now : seasonEnd),
  };
}

/**
 * Format market enum to human-readable label
 */
export function formatMarketLabel(market: Market): string {
  const labels: Record<string, string> = {
    MONEYLINE: "Moneyline",
    SPREAD: "Spread",
    TOTAL_POINTS: "Total Points",
    PLAYER_POINTS: "Player Points",
    PLAYER_REBOUNDS: "Player Rebounds",
    PLAYER_ASSISTS: "Player Assists",
    PLAYER_STEALS: "Player Steals",
    PLAYER_BLOCKS: "Player Blocks",
    PLAYER_THREES: "Player Threes",
    PLAYER_PRA: "Player PRA",
    PLAYER_PASSING_YARDS: "Player Passing Yards",
    PLAYER_RUSHING_YARDS: "Player Rushing Yards",
    PLAYER_RECEIVING_YARDS: "Player Receiving Yards",
    PLAYER_RECEPTIONS: "Player Receptions",
    PLAYER_GOALS: "Player Goals",
    PLAYER_ASSISTS_NHL: "Player Assists",
    PLAYER_SHOTS: "Player Shots",
    // Add more as needed
  };
  
  return labels[market] || market.replace(/_/g, " ");
}

/**
 * Format sportsbook string to display label
 */
export function formatSportsbookLabel(sportsbook: string): string {
  const labels: Record<string, string> = {
    fanduel: "FanDuel",
    draftkings: "DraftKings",
    bet365: "Bet365",
    caesars: "Caesars",
    mgm: "MGM",
    pointsbet: "PointsBet",
    betmgm: "BetMGM",
    unibet: "Unibet",
  };
  
  return labels[sportsbook.toLowerCase()] || sportsbook;
}

/**
 * Format bet type to display label
 */
export function formatBetTypeLabel(betType: string): string {
  const labels: Record<string, string> = {
    straight: "Straight",
    same_game_parlay: "Same Game Parlay",
    same_game_parlay_plus: "Same Game Parlay+",
    parlay: "Parlay",
  };
  
  return labels[betType] || betType;
}

/**
 * Format date range label for display
 */
export function formatDateRangeLabel(dateRange: DateRange): string {
  const labels: Record<DateRange, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "season": "Season",
    "all": "All time",
  };
  
  return labels[dateRange];
}


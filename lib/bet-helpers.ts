// Helper functions for bet calculations and display

type BetResult = "pending" | "win" | "loss" | "void";

interface Leg {
  result: BetResult;
  odds?: number; // Optional for legacy support
}

/**
 * Calculate bet result based on leg results
 * Void legs are excluded from calculation
 */
export function calculateBetResult(legs: Leg[]): BetResult {
  const nonVoidLegs = legs.filter((leg) => leg.result !== "void");

  if (nonVoidLegs.length === 0) {
    return "void";
  }

  if (nonVoidLegs.some((leg) => leg.result === "loss")) {
    return "loss";
  }

  if (nonVoidLegs.every((leg) => leg.result === "win")) {
    return "win";
  }

  return "pending";
}

/**
 * Calculate bet result from leg groups
 * All legs in all groups must win for the bet to win
 */
export function calculateBetResultFromGroups(
  groups: Array<{ legs: Array<{ result: BetResult }> }>
): BetResult {
  // Flatten all legs from all groups
  const allLegs = groups.flatMap((group) => group.legs);
  return calculateBetResult(allLegs);
}

/**
 * Calculate bet odds by multiplying non-void leg odds (legacy - for individual legs)
 */
export function calculateBetOdds(legs: Leg[]): number {
  const nonVoidLegs = legs.filter((leg) => leg.result !== "void" && leg.odds !== undefined && leg.odds !== 0);

  if (nonVoidLegs.length === 0) {
    return 1.0;
  }

  return nonVoidLegs.reduce((acc, leg) => acc * (leg.odds || 1), 1);
}

/**
 * Calculate bet odds from leg groups by multiplying group odds
 */
export function calculateBetOddsFromGroups(groups: Array<{ odds: number }>): number {
  if (groups.length === 0) {
    return 1.0;
  }

  return groups.reduce((acc, group) => acc * group.odds, 1);
}

/**
 * Get formatted bet type label
 */
export function getBetTypeLabel(betType: string, legCount: number): string {
  if (legCount === 1) {
    return "Straight";
  }
  
  if (betType === "same_game_parlay") {
    return `${legCount} leg same game parlay`;
  }
  
  if (betType === "same_game_parlay_plus") {
    return "Same game parlay+";
  }
  
  return `${legCount} leg parlay`;
}

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string, timezone: string = "America/New_York"): string {
  const date = new Date(dateString);

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  // Lowercase AM/PM to match previous style (e.g., "Nov 8, 8:00pm")
  return formatted.replace("AM", "am").replace("PM", "pm");
}

/**
 * Get border color class and glow effect based on result
 * Returns glassmorphism classes with colored glows
 */
export function getBorderColorClass(result: string): string {
  switch (result) {
    case "pending":
      return "glow-pending";
    case "win":
      return "glow-win";
    case "loss":
      return "glow-loss";
    case "void":
      return "glow-void";
    default:
      return "glow-void";
  }
}

/**
 * Get badge color class based on result
 * Returns CSS class matching the border glow colors
 */
export function getBadgeColorClass(result: string): string {
  switch (result) {
    case "pending":
      return "badge-pending";
    case "win":
      return "badge-win";
    case "loss":
      return "badge-loss";
    case "void":
      return "badge-void";
    default:
      return "badge-void";
  }
}

/**
 * Convert decimal odds to American odds format
 */
export function decimalToAmerican(odds: number): string {
  if (odds >= 2.00) {
    return `+${Math.round((odds - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (odds - 1))}`;
  }
}

/**
 * Convert American odds to decimal odds
 * Accepts string (+150, -200) or number (150, -200)
 */
export function americanToDecimal(american: string | number): number {
  let americanNum: number;
  
  if (typeof american === "string") {
    // Remove + sign and parse
    americanNum = parseFloat(american.replace(/\+/, ""));
  } else {
    americanNum = american;
  }
  
  if (isNaN(americanNum)) {
    throw new Error("Invalid American odds format");
  }
  
  if (americanNum > 0) {
    return americanNum / 100 + 1;
  } else {
    return 100 / Math.abs(americanNum) + 1;
  }
}

/**
 * Format odds based on selected format preference
 * Returns "Void" if result is "void"
 */
export function formatOdds(odds: number, format: "decimal" | "american", result?: "pending" | "win" | "loss" | "void"): string {
  if (result === "void") {
    return "Void";
  }
  if (format === "american") {
    return decimalToAmerican(odds);
  }
  return odds.toFixed(2);
}


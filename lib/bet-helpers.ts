// Helper functions for bet calculations and display

type BetResult = "pending" | "win" | "loss" | "void";

interface Leg {
  result: BetResult;
  odds: number;
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
 * Calculate bet odds by multiplying non-void leg odds
 * Returns 1.0 if all legs are void
 */
export function calculateBetOdds(legs: Leg[]): number {
  const nonVoidLegs = legs.filter((leg) => leg.result !== "void");

  if (nonVoidLegs.length === 0) {
    return 1.0;
  }

  return nonVoidLegs.reduce((acc, leg) => acc * leg.odds, 1);
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
  
  return `${legCount} leg parlay`;
}

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Format as "MMM d, h:mma" (e.g., "Nov 8, 8:00pm")
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : "";
  
  return `${month} ${day}, ${displayHours}${displayMinutes}${ampm}`;
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


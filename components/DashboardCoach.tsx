"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardAnalytics } from "@/lib/types/analytics";
import { formatMarketLabel, formatSportsbookLabel } from "@/lib/analytics-helpers";

interface DashboardCoachProps {
  analytics: DashboardAnalytics;
}

export function DashboardCoach({ analytics }: DashboardCoachProps) {
  const insights: string[] = [];

  const { summary, bySportBetType, bestMarkets, worstMarkets, byBook } = analytics;

  // Rule 1: Cold League Warning
  const leagueROIs = new Map<string, { roi: number; betCount: number }>();
  bySportBetType.forEach((item) => {
    const existing = leagueROIs.get(item.league) || { roi: 0, betCount: 0 };
    // Weighted average ROI
    const totalProfit = existing.roi * existing.betCount + item.profit;
    const totalBets = existing.betCount + item.betCount;
    leagueROIs.set(item.league, {
      roi: totalBets > 0 ? (totalProfit / item.staked) * 100 : 0,
      betCount: totalBets,
    });
  });

  const coldLeague = Array.from(leagueROIs.entries()).find(
    ([, data]) => data.roi < -20 && data.betCount >= 20
  );
  if (coldLeague) {
    const bestLeague = Array.from(leagueROIs.entries())
      .filter(([, data]) => data.roi > 0)
      .sort(([, a], [, b]) => b.roi - a.roi)[0];
    insights.push(
      `You're cold on ${coldLeague[0]} lately (${coldLeague[1].roi.toFixed(1)}% ROI over your last ${coldLeague[1].betCount} bets). Consider lowering your stakes${bestLeague ? ` or focusing on ${bestLeague[0]}` : ""}.`
    );
  }

  // Rule 2: Hot Market Encouragement
  const hotMarket = bestMarkets.find((m) => m.roi > 20 && m.betCount >= 10);
  if (hotMarket) {
    insights.push(
      `You're dialed in on ${hotMarket.league} ${formatMarketLabel(hotMarket.market)} props. Maybe prioritize those while you're hot.`
    );
  }

  // Rule 3: Parlay Warning
  const parlayData = bySportBetType.filter((item) => item.betType === "parlay" || item.betType === "same_game_parlay" || item.betType === "same_game_parlay_plus");
  const straightData = bySportBetType.filter((item) => item.betType === "straight");
  
  const parlayROI = parlayData.length > 0
    ? parlayData.reduce((sum, item) => sum + item.roi * item.betCount, 0) / parlayData.reduce((sum, item) => sum + item.betCount, 0)
    : 0;
  const parlayBetCount = parlayData.reduce((sum, item) => sum + item.betCount, 0);
  
  const straightROI = straightData.length > 0
    ? straightData.reduce((sum, item) => sum + item.roi * item.betCount, 0) / straightData.reduce((sum, item) => sum + item.betCount, 0)
    : 0;

  if (parlayROI < -30 && straightROI > 0 && parlayBetCount >= 10) {
    insights.push(
      `Your parlays are dragging you down (${parlayROI.toFixed(1)}% ROI vs ${straightROI.toFixed(1)}% on straights). Try limiting parlays or using them only for fun.`
    );
  }

  // Rule 4: Low Win Rate Warning
  if (summary.winRate < 45 && summary.wins + summary.losses >= 30) {
    insights.push(
      `Your win rate is below break-even (${summary.winRate.toFixed(1)}%). Consider focusing on your strongest markets.`
    );
  }

  // Rule 5: Book Performance
  if (byBook.length >= 2) {
    const bestBook = byBook[0];
    const worstBook = byBook[byBook.length - 1];
    const difference = bestBook.roi - worstBook.roi;
    if (difference >= 15 && bestBook.betCount >= 5 && worstBook.betCount >= 5) {
      insights.push(
        `You perform better at ${formatSportsbookLabel(bestBook.sportsbook)} (${bestBook.roi.toFixed(1)}% ROI) vs ${formatSportsbookLabel(worstBook.sportsbook)} (${worstBook.roi.toFixed(1)}% ROI).`
      );
    }
  }

  // Rule 6: Positive Reinforcement
  if (summary.roi > 10 && summary.totalBets >= 20) {
    insights.push(
      `Great work! You're up ${summary.roi.toFixed(1)}% overall. Keep doing what you're doing.`
    );
  }

  // Check if we have personalized insights
  const hasPersonalizedInsights = insights.length > 0;

  // Default tips if we don't have enough personalized insights
  const defaultTips = [
    "Shop for the best odds across sportsbooks before placing your bet—the same market may have better value elsewhere",
    "Always set a fixed bankroll and only wager a small percentage (e.g., 1-5%) per bet",
  ];

  // If no personalized insights, start with tracking message
  if (!hasPersonalizedInsights) {
    insights.push("Keep tracking your bets to unlock personalized insights. Keep tracking to show your strengths and weaknesses.");
  }

  // Add default tips if we have less than 3 total insights
  while (insights.length < 3 && defaultTips.length > 0) {
    insights.push(defaultTips.shift()!);
  }

  // Fallback if still empty (shouldn't happen)
  if (insights.length === 0) {
    insights.push("Keep tracking your bets to unlock personalized insights.");
  }

  // Limit to 4 insights
  const displayInsights = insights.slice(0, 4);

  return (
    <Card className="glass-card glow-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>BetBuddy's Notes</span>
          <Badge variant="secondary" className="text-xs">Insights</Badge>
        </CardTitle>
        <CardDescription>Personalized tips based on your betting patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {displayInsights.map((insight, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-primary mt-0.5">•</span>
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}


"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketPerformance, BookPerformance } from "@/lib/types/analytics";
import { formatMarketLabel, formatSportsbookLabel } from "@/lib/analytics-helpers";

interface DashboardInsightsProps {
  bestMarkets: MarketPerformance[];
  worstMarkets: MarketPerformance[];
  byBook: BookPerformance[];
}

export function DashboardInsights({ bestMarkets, worstMarkets, byBook }: DashboardInsightsProps) {
  const bestMarket = bestMarkets.length > 0 && bestMarkets[0].betCount >= 5 ? bestMarkets[0] : null;
  const worstMarket = worstMarkets.length > 0 && worstMarkets[0].betCount >= 3 ? worstMarkets[0] : null;
  const bestBook = byBook.length > 0 && byBook[0].betCount >= 5 ? byBook[0] : null;

  // Hide component if no strengths/weaknesses exist yet
  if (!bestMarket && !worstMarket && !bestBook) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Best Sport/Market */}
      <Card className={`glass-card hover:shadow-lg transition-all ${bestMarket ? "border-l-4 border-win-green" : ""}`}>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {bestMarket
              ? `You're best at: ${bestMarket.league} ${formatMarketLabel(bestMarket.market)}`
              : "Keep tracking to see your strengths"}
          </CardTitle>
        </CardHeader>
        {bestMarket && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {bestMarket.record} record, +${bestMarket.profit.toFixed(2)}, +{bestMarket.roi.toFixed(1)}% ROI
            </p>
          </CardContent>
        )}
      </Card>

      {/* Worst Leak */}
      <Card className={`glass-card hover:shadow-lg transition-all ${worstMarket ? "border-l-4 border-destructive" : ""}`}>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {worstMarket
              ? `Your leak: ${worstMarket.league} ${formatMarketLabel(worstMarket.market)}`
              : "Keep tracking to see your weaknesses"}
          </CardTitle>
        </CardHeader>
        {worstMarket && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {worstMarket.record}, -${Math.abs(worstMarket.profit).toFixed(2)}, {worstMarket.roi.toFixed(1)}% ROI
            </p>
          </CardContent>
        )}
      </Card>

      {/* Book Edge */}
      {bestBook && (
        <Card className="glass-card hover:shadow-lg transition-all border-l-4 border-primary">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              You do best at: {formatSportsbookLabel(bestBook.sportsbook)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {bestBook.roi >= 0 ? "+" : ""}
              {bestBook.roi.toFixed(1)}% ROI across {bestBook.betCount} bets
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


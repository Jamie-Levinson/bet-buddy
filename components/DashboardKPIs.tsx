"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { formatDateRangeLabel } from "@/lib/analytics-helpers";
import { formatSportsbookLabel } from "@/lib/analytics-helpers";
import type { SummaryStats, DateRange } from "@/lib/types/analytics";

interface DashboardKPIsProps {
  summary: SummaryStats;
  dateRange: DateRange;
}

export function DashboardKPIs({ summary, dateRange }: DashboardKPIsProps) {
  const { format } = useOddsFormat();
  const dateRangeLabel = formatDateRangeLabel(dateRange);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Profit */}
      <Card className="glass-card hover:shadow-xl hover:shadow-black/30 transition-all">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Net Profit
          </CardDescription>
          <CardTitle
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
              summary.netProfit >= 0 ? "text-win-green" : "text-destructive"
            }`}
          >
            {summary.netProfit >= 0 ? "+" : ""}${summary.netProfit.toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">in {dateRangeLabel}</p>
          {summary.bestBook && (
            <p className="text-xs text-muted-foreground mt-1">
              Best book: {formatSportsbookLabel(summary.bestBook.name)} (+${summary.bestBook.profit.toFixed(2)})
            </p>
          )}
        </CardContent>
      </Card>

      {/* ROI */}
      <Card className="glass-card hover:shadow-xl hover:shadow-black/30 transition-all">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">ROI</CardDescription>
          <CardTitle
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
              summary.roi >= 0 ? "text-win-green" : "text-destructive"
            }`}
          >
            {summary.roi >= 0 ? "+" : ""}
            {summary.roi.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Across {summary.totalBets} bets</p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="glass-card hover:shadow-xl hover:shadow-black/30 transition-all">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">Win Rate</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {summary.winRate.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {summary.wins}-{summary.losses}-{summary.voids} record
          </p>
        </CardContent>
      </Card>

      {/* Average Odds / Risk */}
      <Card className="glass-card hover:shadow-xl hover:shadow-black/30 transition-all">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Average Odds / Risk
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {summary.avgOdds > 0 ? formatOdds(summary.avgOdds, format, "pending") : "--"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Avg stake: ${summary.avgStake.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}


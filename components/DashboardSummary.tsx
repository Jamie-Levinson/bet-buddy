"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryStats } from "@/lib/types/analytics";

interface DashboardSummaryProps {
  summary: SummaryStats;
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div>
            <p className="text-sm text-muted-foreground">Total Bets</p>
            <p className="text-2xl font-bold">{summary.totalBets}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unsettled</p>
            <p className="text-2xl font-bold text-yellow-500">{summary.pending}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-win-green">{summary.wins}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-destructive">{summary.losses}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Wager</p>
            <p className="text-2xl font-bold">
              ${summary.avgStake.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


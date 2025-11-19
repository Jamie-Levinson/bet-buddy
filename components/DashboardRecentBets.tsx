"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format as formatDate } from "date-fns";
import { formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { formatSportsbookLabel } from "@/lib/analytics-helpers";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface DashboardRecentBetsProps {
  bets: SerializedBetWithLegs[];
}

export function DashboardRecentBets({ bets }: DashboardRecentBetsProps) {
  const router = useRouter();
  const { format: oddsFormat } = useOddsFormat();
  const [minStake, setMinStake] = useState<number | null>(null);

  const filteredBets = minStake ? bets.filter((bet) => bet.wager >= minStake) : bets;

  const getResultBadge = (result: string) => {
    switch (result) {
      case "win":
        return <Badge variant="outline" className="text-win-green border-win-green">Win</Badge>;
      case "loss":
        return <Badge variant="outline" className="text-destructive border-destructive">Loss</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case "void":
        return <Badge variant="outline" className="text-muted-foreground">Void</Badge>;
      default:
        return null;
    }
  };

  const getProfit = (bet: SerializedBetWithLegs) => {
    if (bet.result === "win") {
      return { value: bet.payout, color: "text-win-green" };
    } else if (bet.result === "loss") {
      return { value: -bet.wager, color: "text-destructive" };
    } else if (bet.result === "pending") {
      return { value: null, color: "text-muted-foreground" };
    } else {
      return { value: 0, color: "text-muted-foreground" };
    }
  };

  const getLeague = (bet: SerializedBetWithLegs): string => {
    const firstLeg = bet.legGroups[0]?.legs[0];
    return firstLeg?.league || "N/A";
  };

  const getDescription = (bet: SerializedBetWithLegs): string => {
    const firstLeg = bet.legGroups[0]?.legs[0];
    if (firstLeg?.description) {
      return firstLeg.description.length > 50
        ? firstLeg.description.substring(0, 50) + "..."
        : firstLeg.description;
    }
    return "Bet";
  };

  if (filteredBets.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Bets</CardTitle>
          <CardDescription>Your most recent betting activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No bets found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Bets</CardTitle>
            <CardDescription>Your most recent betting activity</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bigBetsOnly"
              checked={minStake !== null}
              onCheckedChange={(checked) => setMinStake(checked ? 50 : null)}
            />
            <Label htmlFor="bigBetsOnly" className="text-sm cursor-pointer">
              Show only big bets ($50+)
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Sport/Book</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right">Stake</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Odds</TableHead>
              <TableHead className="text-center">Result</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBets.map((bet) => {
              const profit = getProfit(bet);
              return (
                <TableRow
                  key={bet.id}
                  className="cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => router.push(`/bets/${bet.id}`)}
                >
                  <TableCell className="hidden sm:table-cell text-sm">
                    {formatDate(new Date(bet.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <div>{getLeague(bet)}</div>
                      {bet.sportsbook && (
                        <div className="text-xs text-muted-foreground">
                          {formatSportsbookLabel(bet.sportsbook)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {getDescription(bet)}
                  </TableCell>
                  <TableCell className="text-right text-sm">${bet.wager.toFixed(2)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-sm">
                    {formatOdds(bet.odds, oddsFormat, bet.result)}
                  </TableCell>
                  <TableCell className="text-center">{getResultBadge(bet.result)}</TableCell>
                  <TableCell className={`text-right text-sm font-semibold ${profit.color}`}>
                    {profit.value === null
                      ? "--"
                      : profit.value >= 0
                        ? `+$${profit.value.toFixed(2)}`
                        : `-$${Math.abs(profit.value).toFixed(2)}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


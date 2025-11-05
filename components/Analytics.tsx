"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface AnalyticsProps {
  bets: SerializedBetWithLegs[];
}

export function Analytics({ bets }: AnalyticsProps) {
  const stats = useMemo(() => {
    // Only count settled bets for profit/loss calculations
    const settledBets = bets.filter((bet) => bet.result !== "pending");
    const totalWagered = settledBets.reduce((sum, bet) => sum + bet.wager, 0);
    const totalPayout = settledBets.reduce((sum, bet) => {
      if (bet.result === "win") {
        return sum + bet.payout;
      }
      return sum;
    }, 0);
    const totalProfit = totalPayout - totalWagered;
    const winCount = settledBets.filter((bet) => bet.result === "win").length;
    const lossCount = settledBets.filter((bet) => bet.result === "loss").length;
    const winRate = settledBets.length > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
    const roi = totalWagered > 0 ? (totalProfit / totalWagered) * 100 : 0;

    const betCountByType = bets.reduce(
      (acc, bet) => {
        acc[bet.betType] = (acc[bet.betType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate profit trend over last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
    const profitTrend = last30Days.map((date) => {
      const dayBets = bets.filter(
        (bet) => format(new Date(bet.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd") && bet.result !== "pending"
      );
      const profit = dayBets.reduce((sum, bet) => {
        if (bet.result === "win") {
          return sum + bet.payout - bet.wager;
        } else if (bet.result === "loss") {
          return sum - bet.wager;
        }
        return sum;
      }, 0);
      return {
        date: format(date, "MMM d"),
        profit: profit,
      };
    });

    return {
      totalWagered,
      totalProfit,
      winRate,
      roi,
      betCountByType,
      profitTrend,
      totalBets: bets.length,
      pendingBets: bets.filter((bet) => bet.result === "pending").length,
      settledBets: settledBets.length,
    };
  }, [bets]);

  const betTypeData = [
    { name: "Straight", count: stats.betCountByType.straight || 0 },
    { name: "SGP", count: stats.betCountByType.same_game_parlay || 0 },
    { name: "Parlay", count: stats.betCountByType.parlay || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Wagered</CardDescription>
            <CardTitle className="text-2xl">${stats.totalWagered.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Profit/Loss</CardDescription>
            <CardTitle className={`text-2xl ${stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${stats.totalProfit >= 0 ? "+" : ""}
              {stats.totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
            <CardTitle className="text-2xl">{stats.winRate.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ROI</CardDescription>
            <CardTitle className={`text-2xl ${stats.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.roi >= 0 ? "+" : ""}
              {stats.roi.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend (Last 30 Days)</CardTitle>
            <CardDescription>Daily profit/loss over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.profitTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bets by Type</CardTitle>
            <CardDescription>Distribution of bet types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={betTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Bets</p>
              <p className="text-2xl font-bold">{stats.totalBets}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unsettled</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pendingBets}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wins</p>
              <p className="text-2xl font-bold text-green-600">
                {bets.filter((b) => b.result === "win").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losses</p>
              <p className="text-2xl font-bold text-red-600">
                {bets.filter((b) => b.result === "loss").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Wager</p>
              <p className="text-2xl font-bold">
                ${stats.settledBets > 0 ? (stats.totalWagered / stats.settledBets).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


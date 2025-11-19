"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeBet, serializeBets } from "@/lib/serialize";
import { LeagueEnum, BetResult } from "@prisma/client";
import type { DashboardAnalytics, DashboardFilters, DateRange } from "@/lib/types/analytics";
import { getDateRange } from "@/lib/analytics-helpers";

export async function getDashboardAnalytics(
  userId: string,
  filters: DashboardFilters
): Promise<DashboardAnalytics> {
  // Build date filter
  const dateRange = getDateRange(filters.dateRange);
  const dateFilter = dateRange
    ? {
        gte: dateRange.start,
        lte: dateRange.end,
      }
    : undefined;

  // Build league filter (through legGroups -> legs)
  const leagueFilter = filters.league
    ? {
        legGroups: {
          some: {
            legs: {
              some: {
                league: filters.league,
              },
            },
          },
        },
      }
    : undefined;

  // Build sportsbook filter
  const sportsbookFilter = filters.sportsbook
    ? {
        sportsbook: filters.sportsbook,
      }
    : undefined;

  // Combine all filters
  const whereClause = {
    userId,
    ...(dateFilter && { date: dateFilter }),
    ...leagueFilter,
    ...sportsbookFilter,
  };

  // Fetch all bets with necessary relations
  const bets = await prisma.bet.findMany({
    where: whereClause,
    include: {
      legGroups: {
        include: {
          legs: {
            select: {
              id: true,
              league: true,
              market: true,
              result: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Separate settled and all bets
  const settledBets = bets.filter((bet) => bet.result !== "pending" && bet.result !== "void");
  const voidBets = bets.filter((bet) => bet.result === "void");

  // Calculate summary stats
  const totalWagered = settledBets.reduce((sum, bet) => sum + Number(bet.wager), 0);
  const totalPayout = settledBets
    .filter((bet) => bet.result === "win")
    .reduce((sum, bet) => sum + Number(bet.payout), 0);
  const netProfit = totalPayout - totalWagered;
  const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

  const wins = settledBets.filter((bet) => bet.result === "win").length;
  const losses = settledBets.filter((bet) => bet.result === "loss").length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  const totalOdds = settledBets.reduce((sum, bet) => sum + Number(bet.odds), 0);
  const avgOdds = settledBets.length > 0 ? totalOdds / settledBets.length : 0;
  const avgStake = settledBets.length > 0 ? totalWagered / settledBets.length : 0;

  // Calculate by book (for best book)
  const byBookMap = new Map<string, { profit: number; betCount: number }>();
  settledBets.forEach((bet) => {
    if (bet.sportsbook) {
      const existing = byBookMap.get(bet.sportsbook) || { profit: 0, betCount: 0 };
      const profit = bet.result === "win" ? Number(bet.payout) - Number(bet.wager) : -Number(bet.wager);
      byBookMap.set(bet.sportsbook, {
        profit: existing.profit + profit,
        betCount: existing.betCount + 1,
      });
    }
  });

  const bestBookEntry = Array.from(byBookMap.entries())
    .map(([name, data]) => ({ name, profit: data.profit, betCount: data.betCount }))
    .sort((a, b) => b.profit - a.profit)[0];

  const summary = {
    totalWagered,
    netProfit,
    roi,
    winRate,
    avgOdds,
    avgStake,
    totalBets: bets.length,
    wins,
    losses,
    pending: bets.filter((bet) => bet.result === "pending").length,
    voids: voidBets.length,
    bestBook: bestBookEntry ? { name: bestBookEntry.name, profit: bestBookEntry.profit } : undefined,
  };

  // Calculate profit by date (cumulative)
  const profitByDateMap = new Map<string, { dailyProfit: number; cumulativeProfit: number }>();
  let runningCumulative = 0;

  // Sort bets by date ascending for cumulative calculation
  const sortedBets = [...settledBets].sort((a, b) => a.date.getTime() - b.date.getTime());

  sortedBets.forEach((bet) => {
    const dateKey = bet.date.toISOString().split("T")[0];
    const profit = bet.result === "win" ? Number(bet.payout) - Number(bet.wager) : -Number(bet.wager);
    
    const existing = profitByDateMap.get(dateKey) || { dailyProfit: 0, cumulativeProfit: 0 };
    existing.dailyProfit += profit;
    runningCumulative += profit;
    existing.cumulativeProfit = runningCumulative;
    
    profitByDateMap.set(dateKey, existing);
  });

  // Convert to array and fill in missing dates if needed
  const profitByDate = Array.from(profitByDateMap.entries())
    .map(([date, data]) => ({
      date,
      cumulativeProfit: data.cumulativeProfit,
      dailyProfit: data.dailyProfit,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate by sport + bet type
  const bySportBetTypeMap = new Map<string, {
    league: LeagueEnum;
    betType: string;
    profit: number;
    staked: number;
    betCount: number;
  }>();

  settledBets.forEach((bet) => {
    // Get league from first leg
    const firstLeg = bet.legGroups[0]?.legs[0];
    if (!firstLeg?.league) return;

    const key = `${firstLeg.league}-${bet.betType}`;
    const existing = bySportBetTypeMap.get(key) || {
      league: firstLeg.league,
      betType: bet.betType,
      profit: 0,
      staked: 0,
      betCount: 0,
    };

    const profit = bet.result === "win" ? Number(bet.payout) - Number(bet.wager) : -Number(bet.wager);
    existing.profit += profit;
    existing.staked += Number(bet.wager);
    existing.betCount += 1;

    bySportBetTypeMap.set(key, existing);
  });

  const bySportBetType = Array.from(bySportBetTypeMap.values())
    .map((item) => ({
      league: item.league,
      betType: item.betType as any,
      profit: item.profit,
      staked: item.staked,
      roi: item.staked > 0 ? (item.profit / item.staked) * 100 : 0,
      betCount: item.betCount,
    }))
    .sort((a, b) => b.profit - a.profit);

  // Calculate by market (best/worst)
  const marketMap = new Map<string, {
    league: LeagueEnum;
    market: string;
    wins: number;
    losses: number;
    profit: number;
    betCount: number;
  }>();

  settledBets.forEach((bet) => {
    bet.legGroups.forEach((group) => {
      group.legs.forEach((leg) => {
        if (!leg.league || !leg.market) return;

        const key = `${leg.league}-${leg.market}`;
        const existing = marketMap.get(key) || {
          league: leg.league,
          market: leg.market,
          wins: 0,
          losses: 0,
          profit: 0,
          betCount: 0,
        };

        // For market performance, we use leg result if available, otherwise bet result
        const legResult = leg.result !== "pending" ? leg.result : bet.result;
        if (legResult === "win") {
          existing.wins += 1;
          // Approximate profit per leg (divide bet profit by leg count)
          const legProfit = bet.result === "win" 
            ? (Number(bet.payout) - Number(bet.wager)) / bet.legGroups.reduce((sum, g) => sum + g.legs.length, 0)
            : -Number(bet.wager) / bet.legGroups.reduce((sum, g) => sum + g.legs.length, 0);
          existing.profit += legProfit;
        } else if (legResult === "loss") {
          existing.losses += 1;
          const legLoss = -Number(bet.wager) / bet.legGroups.reduce((sum, g) => sum + g.legs.length, 0);
          existing.profit += legLoss;
        }
        existing.betCount += 1;

        marketMap.set(key, existing);
      });
    });
  });

  const marketPerformances = Array.from(marketMap.values())
    .map((item) => ({
      league: item.league,
      market: item.market as any,
      profit: item.profit,
      roi: item.betCount > 0 ? (item.profit / (item.wins + item.losses)) * 100 : 0, // Simplified ROI
      record: `${item.wins}-${item.losses}`,
      betCount: item.betCount,
    }))
    .filter((item) => item.betCount >= 3); // Minimum 3 bets for insights

  const bestMarkets = [...marketPerformances]
    .filter((item) => item.roi > 0)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  const worstMarkets = [...marketPerformances]
    .filter((item) => item.roi < 0)
    .sort((a, b) => a.roi - b.roi)
    .slice(0, 5);

  // Calculate by book
  const byBook = Array.from(byBookMap.entries())
    .map(([sportsbook, data]) => {
      const staked = settledBets
        .filter((bet) => bet.sportsbook === sportsbook)
        .reduce((sum, bet) => sum + Number(bet.wager), 0);
      return {
        sportsbook,
        profit: data.profit,
        roi: staked > 0 ? (data.profit / staked) * 100 : 0,
        betCount: data.betCount,
      };
    })
    .sort((a, b) => b.roi - a.roi);

  // Get recent bets (last 20)
  const recentBets = bets.slice(0, 20).map((bet) => serializeBet(bet));

  return {
    summary,
    profitByDate,
    bySportBetType,
    bestMarkets,
    worstMarkets,
    byBook,
    recentBets,
  };
}


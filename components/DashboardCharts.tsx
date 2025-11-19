"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { format } from "date-fns";
import type { ProfitByDate, SportBetTypeBreakdown } from "@/lib/types/analytics";
import { LeagueEnum, BetType } from "@prisma/client";
import { formatBetTypeLabel } from "@/lib/analytics-helpers";

interface DashboardChartsProps {
  profitByDate: ProfitByDate[];
  bySportBetType: SportBetTypeBreakdown[];
}

// Use brighter, more visible colors with better contrast
const BET_TYPE_COLORS: Record<BetType, string> = {
  straight: "#3b82f6", // Bright blue
  same_game_parlay: "#10b981", // Bright green
  same_game_parlay_plus: "#f59e0b", // Bright amber
  parlay: "#8b5cf6", // Bright purple
};

// White color for all chart text elements
const TEXT_COLOR = "#fafafa"; // Using explicit white instead of CSS variable for Recharts compatibility

export function DashboardCharts({ profitByDate, bySportBetType }: DashboardChartsProps) {
  // Ensure we have data points for the last 7 days, even if no bets exist
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i)); // Last 7 days including today
    return date.toISOString().split("T")[0];
  });

  // Create a map of existing data
  const profitByDateMap = new Map(
    profitByDate.map((item) => [item.date, item])
  );

  // Find the baseline cumulative profit (from data before the 7-day window, or 0)
  // Sort existing data by date and find the cumulative from before our 7-day window
  const sortedExistingDates = [...profitByDate].sort((a, b) => a.date.localeCompare(b.date));
  const firstDayInWindow = last7Days[0];
  const dataBeforeWindow = sortedExistingDates.filter((item) => item.date < firstDayInWindow);
  const baselineCumulative = dataBeforeWindow.length > 0
    ? Number(dataBeforeWindow[dataBeforeWindow.length - 1].cumulativeProfit.toFixed(2))
    : 0;

  // Build chart data with all 7 days, filling in missing days
  let runningCumulative = baselineCumulative;
  
  const profitChartData = last7Days.map((dateStr) => {
    const existing = profitByDateMap.get(dateStr);
    if (existing) {
      // Update running cumulative to match this day's value
      runningCumulative = Number(existing.cumulativeProfit.toFixed(2));
      return {
        date: format(new Date(dateStr), "MMM d"),
        fullDate: dateStr,
        cumulativeProfit: runningCumulative,
        dailyProfit: Number(existing.dailyProfit.toFixed(2)),
      };
    } else {
      // No data for this day, use previous cumulative profit (flat line)
      return {
        date: format(new Date(dateStr), "MMM d"),
        fullDate: dateStr,
        cumulativeProfit: runningCumulative,
        dailyProfit: 0,
      };
    }
  });

  // Transform data for sport + bet type breakdown
  const leagues = Array.from(new Set(bySportBetType.map((item) => item.league)));
  const betTypes = Array.from(new Set(bySportBetType.map((item) => item.betType))) as BetType[];

  const sportBetTypeChartData = leagues.map((league) => {
    const data: Record<string, any> = { league };
    betTypes.forEach((betType) => {
      const item = bySportBetType.find((b) => b.league === league && b.betType === betType);
      data[betType] = item ? Number(item.profit.toFixed(2)) : 0;
    });
    return data;
  });

  // Calculate min and max values for Y-axis centering at 0
  const allValues = sportBetTypeChartData.flatMap((item) =>
    betTypes.map((betType) => item[betType] || 0)
  );
  const minValue = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues, 0) : 0;
  const absMax = Math.max(Math.abs(minValue), Math.abs(maxValue));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card rounded-lg border p-3 shadow-lg">
          <p className="font-semibold mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-foreground" style={{ color: entry.color }}>
              {entry.name}: {entry.value >= 0 ? "+" : ""}${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ProfitTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card rounded-lg border p-3 shadow-lg">
          <p className="font-semibold mb-2 text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            Daily: {data.dailyProfit >= 0 ? "+" : ""}${data.dailyProfit.toFixed(2)}
          </p>
          <p className="text-sm text-foreground">
            Cumulative: {data.cumulativeProfit >= 0 ? "+" : ""}${data.cumulativeProfit.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profit Over Time */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profit Over Time</CardTitle>
          <CardDescription>Bankroll over time (cumulative profit)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke={TEXT_COLOR}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                tickLine={{ stroke: TEXT_COLOR }}
                axisLine={{ stroke: TEXT_COLOR }}
              />
              <YAxis
                stroke={TEXT_COLOR}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                tickLine={{ stroke: TEXT_COLOR }}
                axisLine={{ stroke: TEXT_COLOR }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={60}
              />
              <Tooltip content={<ProfitTooltip />} />
              <Line
                type="monotone"
                dataKey="cumulativeProfit"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sport + Bet Type Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Sport + Bet Type Breakdown</CardTitle>
          <CardDescription>Net profit by league and bet type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sportBetTypeChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" opacity={0.3} />
              <XAxis
                dataKey="league"
                stroke={TEXT_COLOR}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                tickLine={{ stroke: TEXT_COLOR }}
                axisLine={{ stroke: TEXT_COLOR }}
              />
              <YAxis
                stroke={TEXT_COLOR}
                tick={{ fill: TEXT_COLOR, fontSize: 12 }}
                tickLine={{ stroke: TEXT_COLOR }}
                axisLine={{ stroke: TEXT_COLOR }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                domain={absMax > 0 ? [-absMax * 1.1, absMax * 1.1] : ['auto', 'auto']}
                allowDataOverflow={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: TEXT_COLOR, fontSize: 12 }}
                iconType="square"
                iconSize={12}
              />
              {betTypes.map((betType) => (
                <Bar
                  key={betType}
                  dataKey={betType}
                  name={formatBetTypeLabel(betType)}
                  fill={BET_TYPE_COLORS[betType]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}


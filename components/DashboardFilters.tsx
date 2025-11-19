"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LeagueEnum } from "@prisma/client";
import type { DateRange } from "@/lib/types/analytics";

const SPORTSBOOKS = [
  { value: "fanduel", label: "FanDuel" },
  { value: "draftkings", label: "DraftKings" },
  { value: "bet365", label: "Bet365" },
  { value: "caesars", label: "Caesars" },
  { value: "mgm", label: "MGM" },
  { value: "pointsbet", label: "PointsBet" },
  { value: "betmgm", label: "BetMGM" },
  { value: "unibet", label: "Unibet" },
];

const LEAGUES = [
  { value: "all", label: "All" },
  { value: LeagueEnum.NBA, label: "NBA" },
  { value: LeagueEnum.NFL, label: "NFL" },
  { value: LeagueEnum.NHL, label: "NHL" },
  { value: LeagueEnum.MLB, label: "MLB" },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "season", label: "Season" },
  { value: "all", label: "All time" },
];

export function DashboardFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateRange = (searchParams.get("dateRange") as DateRange) || "30d";
  const league = searchParams.get("league") || "all";
  const sportsbook = searchParams.get("sportsbook") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <Card className="glass-card rounded-lg p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Date Range</label>
          <Select value={dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Sport</label>
          <Select value={league} onValueChange={(value) => updateFilter("league", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAGUES.map((lg) => (
                <SelectItem key={lg.value} value={lg.value}>
                  {lg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Book</label>
          <Select value={sportsbook} onValueChange={(value) => updateFilter("sportsbook", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {SPORTSBOOKS.map((book) => (
                <SelectItem key={book.value} value={book.value}>
                  {book.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}


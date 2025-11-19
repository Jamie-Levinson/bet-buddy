import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboardAnalytics } from "@/actions/analytics-actions";
import { DashboardFilters } from "@/components/DashboardFilters";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardInsights } from "@/components/DashboardInsights";
import { DashboardCoach } from "@/components/DashboardCoach";
import { DashboardSummary } from "@/components/DashboardSummary";
import { WelcomeMessage } from "./WelcomeMessage";
import { LeagueEnum } from "@prisma/client";
import type { DateRange } from "@/lib/types/analytics";

interface DashboardPageProps {
  searchParams: Promise<{
    dateRange?: string;
    league?: string;
    sportsbook?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Middleware already authenticated, but check here for redirect
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const dateRange = (params.dateRange as DateRange) || "30d";
  const league = params.league && params.league !== "all" ? (params.league as LeagueEnum) : undefined;
  const sportsbook = params.sportsbook && params.sportsbook !== "all" ? params.sportsbook : undefined;

  // Fetch analytics data
  const analytics = await getDashboardAnalytics(user.id, {
    dateRange,
    league,
    sportsbook,
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 max-w-full">
      <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            Welcome, <WelcomeMessage userEmail={user.email || ""} />
          </p>
        </div>
        <div className="flex flex-row flex-nowrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <Link href="/bets">
            <Button variant="outline" className="min-h-[44px] whitespace-nowrap text-xs sm:text-sm">
              View All Bets
            </Button>
          </Link>
          <Link href="/bets/new">
            <Button className="min-h-[44px] whitespace-nowrap text-xs sm:text-sm">New Bet</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <DashboardFilters />
        <DashboardKPIs summary={analytics.summary} dateRange={dateRange} />
        <DashboardCharts
          profitByDate={analytics.profitByDate}
          bySportBetType={analytics.bySportBetType}
        />
        <DashboardSummary summary={analytics.summary} />
        {(analytics.bestMarkets.length > 0 && analytics.bestMarkets[0].betCount >= 5) ||
         (analytics.worstMarkets.length > 0 && analytics.worstMarkets[0].betCount >= 3) ||
         (analytics.byBook.length > 0 && analytics.byBook[0].betCount >= 5) ? (
          <DashboardInsights
            bestMarkets={analytics.bestMarkets}
            worstMarkets={analytics.worstMarkets}
            byBook={analytics.byBook}
          />
        ) : null}
        <DashboardCoach analytics={analytics} />
      </div>
    </div>
  );
}

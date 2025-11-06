import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBets } from "@/actions/bet-actions";
import { Analytics } from "@/components/Analytics";
import { OddsFormatSelector } from "@/components/OddsFormatSelector";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { bets } = await getBets(1, 100); // Get more bets for analytics

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 max-w-full">
      <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Welcome, {user.email}</p>
        </div>
        <div className="flex flex-row flex-nowrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <OddsFormatSelector />
          <Link href="/bets">
            <Button variant="outline" className="min-h-[44px] whitespace-nowrap text-xs sm:text-sm">View All Bets</Button>
          </Link>
          <Link href="/bets/new">
            <Button className="min-h-[44px] whitespace-nowrap text-xs sm:text-sm">New Bet</Button>
          </Link>
        </div>
      </div>
      <Analytics bets={bets} />
    </div>
  );
}


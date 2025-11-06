import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBets } from "@/actions/bet-actions";
import { Analytics } from "@/components/Analytics";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { bets } = await getBets(1, 100); // Get more bets for analytics

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Welcome, {user.email}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/bets" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">View All Bets</Button>
          </Link>
          <Link href="/bets/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">New Bet</Button>
          </Link>
        </div>
      </div>
      <Analytics bets={bets} />
    </div>
  );
}


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
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/bets">
            <Button variant="outline">View All Bets</Button>
          </Link>
          <Link href="/bets/new">
            <Button>New Bet</Button>
          </Link>
        </div>
      </div>
      <p className="mb-6 text-muted-foreground">Welcome, {user.email}</p>
      <Analytics bets={bets} />
    </div>
  );
}


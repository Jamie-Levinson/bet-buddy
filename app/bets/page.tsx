import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBets } from "@/actions/bet-actions";
import { BetList } from "@/components/BetList";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BetsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function BetsPage({ searchParams }: BetsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { bets, total, totalPages } = await getBets(page, 20);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Bets</h1>
        <Link href="/bets/new">
          <Button>New Bet</Button>
        </Link>
      </div>
      <BetList bets={bets} total={total} page={page} totalPages={totalPages} />
    </div>
  );
}


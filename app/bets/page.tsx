import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBets } from "@/actions/bet-actions";
import { BetList } from "@/components/BetList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OddsFormatSelector } from "@/components/OddsFormatSelector";

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">All Bets</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <OddsFormatSelector />
          <Link href="/bets/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">New Bet</Button>
          </Link>
        </div>
      </div>
      <BetList bets={bets} total={total} page={page} totalPages={totalPages} />
    </div>
  );
}


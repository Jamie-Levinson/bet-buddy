import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBet, updateBet, deleteBet } from "@/actions/bet-actions";
import { BetForm } from "@/components/BetForm";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteBetButton } from "@/components/DeleteBetButton";
import { UpdateBetForm } from "@/components/UpdateBetForm";
import { type BetFormData } from "@/lib/validations/bet";

interface BetDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BetDetailPage({ params }: BetDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let bet;
  try {
    bet = await getBet(id);
  } catch (error) {
    redirect("/bets");
  }

  const defaultValues: Partial<BetFormData> = {
    wager: bet.wager,
    isBonusBet: bet.isBonusBet,
    boostPercentage: bet.boostPercentage ?? undefined,
    isNoSweat: bet.isNoSweat,
    legs: bet.legs.map((leg) => ({
      league: leg.league!,
      gameId: leg.gameId!,
      market: leg.market!,
      playerId: leg.playerId ?? undefined,
      teamId: leg.teamId ?? undefined,
      qualifier: leg.qualifier ?? undefined,
      threshold: leg.threshold ?? undefined,
      date: leg.eventDate ? format(new Date(leg.eventDate), "yyyy-MM-dd") : undefined,
      description: leg.description,
      eventName: leg.eventName,
      odds: leg.odds,
      result: leg.result || "pending",
    })),
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Bet</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              className={
                bet.result === "pending"
                  ? "bg-yellow-500"
                  : bet.result === "win"
                    ? "bg-win-green"
                    : bet.result === "loss"
                      ? "bg-destructive"
                      : "bg-muted"
              }
            >
              {bet.result === "pending" ? "Unsettled" : bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-row flex-nowrap gap-2">
          <Link href="/bets">
            <Button variant="outline" className="min-h-[44px] whitespace-nowrap">Back to Bets</Button>
          </Link>
          <DeleteBetButton betId={id} />
        </div>
      </div>
      <UpdateBetForm betId={id} defaultValues={defaultValues} />
    </div>
  );
}


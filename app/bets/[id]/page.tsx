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
    betType: bet.betType,
    wager: Number(bet.wager),
    payout: Number(bet.payout),
    odds: Number(bet.odds),
    date: format(new Date(bet.date), "yyyy-MM-dd"),
    result: bet.result,
    isBonusBet: bet.isBonusBet,
    boostPercentage: bet.boostPercentage ?? undefined,
    isNoSweat: bet.isNoSweat,
    legs: bet.legs.map((leg: { description: string; eventName: string; odds: any; result: "win" | "loss" | "void" }) => ({
      description: leg.description,
      eventName: leg.eventName,
      odds: Number(leg.odds),
      result: leg.result,
    })),
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Bet</h1>
        <div className="flex gap-2">
          <Link href="/bets">
            <Button variant="outline">Back to Bets</Button>
          </Link>
          <DeleteBetButton betId={id} />
        </div>
      </div>
      <UpdateBetForm betId={id} defaultValues={defaultValues} />
    </div>
  );
}


"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { LegCard } from "@/components/LegCard";
import { getBetTypeLabel, getBorderColorClass } from "@/lib/bet-helpers";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface BetCardProps {
  bet: SerializedBetWithLegs;
}

export function BetCard({ bet }: BetCardProps) {
  const borderColorClass = getBorderColorClass(bet.result);
  const betTypeLabel = getBetTypeLabel(bet.betType, bet.legs.length);

  // Calculate profit/returned amount
  const getReturnedText = () => {
    if (bet.result === "win") {
      return { label: "Returned:", amount: bet.payout.toFixed(2), color: "text-green-600 dark:text-green-400" };
    } else if (bet.result === "loss") {
      return { label: "Returned:", amount: "0", color: "text-red-600 dark:text-red-400" };
    } else {
      // pending or void
      return { label: "To Return:", amount: bet.payout.toFixed(2), color: "text-foreground" };
    }
  };

  const returnedInfo = getReturnedText();

  return (
    <div className={`rounded-lg border-2 ${borderColorClass} bg-card p-4 space-y-3`}>
      {/* First Row: Title + Odds | Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-base">{betTypeLabel}</div>
          <div className="text-sm text-muted-foreground">{bet.odds.toFixed(2)}</div>
        </div>
        <Link href={`/bets/${bet.id}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Pencil className="h-4 w-4 mr-1" />
            <span className="text-xs">Edit</span>
          </Button>
        </Link>
      </div>

      {/* Second Row: Wager | Returned */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Wager: <span className="font-semibold text-foreground">${bet.wager.toFixed(2)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {returnedInfo.label}{" "}
          <span className={`font-semibold ${returnedInfo.color}`}>${returnedInfo.amount}</span>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-2">
        {bet.legs.map((leg) => (
          <LegCard key={leg.id} leg={leg} />
        ))}
      </div>
    </div>
  );
}


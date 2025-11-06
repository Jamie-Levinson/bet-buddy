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
      return { label: "Returned:", amount: bet.payout.toFixed(2), color: "text-win-green" };
    } else if (bet.result === "loss") {
      return { label: "Returned:", amount: "0", color: "text-destructive" };
    } else {
      // pending or void
      return { label: "To Return:", amount: bet.payout.toFixed(2), color: "text-foreground" };
    }
  };

  const returnedInfo = getReturnedText();

  return (
    <div className={`glass-card rounded-xl ${borderColorClass} p-4 sm:p-5 space-y-3 sm:space-y-4 transition-all hover:shadow-xl hover:shadow-black/30`}>
      {/* First Row: Title + Odds | Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-base">{betTypeLabel}</div>
          <div className="text-sm text-muted-foreground">{bet.odds.toFixed(2)}</div>
        </div>
        <Link href={`/bets/${bet.id}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-primary hover:text-primary/80">
            <Pencil className="h-4 w-4 mr-1" />
            <span className="text-xs hidden sm:inline">Edit</span>
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


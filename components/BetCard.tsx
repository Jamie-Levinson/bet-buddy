"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { LegCard } from "@/components/LegCard";
import { getBorderColorClass, getBadgeColorClass, formatOdds, getBetTypeLabel } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface BetCardProps {
  bet: SerializedBetWithLegs;
}

export function BetCard({ bet }: BetCardProps) {
  const borderColorClass = getBorderColorClass(bet.result);
  const { format } = useOddsFormat();
  const badgeColorClass = getBadgeColorClass(bet.result);

  // Show total bet payout (all groups must win for payout)
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

  // Calculate total leg count across all leg groups
  const totalLegCount = bet.legGroups.reduce((sum, group) => sum + group.legs.length, 0);
  const betTypeTitle = getBetTypeLabel(bet.betType, totalLegCount);

  return (
    <div className={`glass-card rounded-xl ${borderColorClass} p-4 sm:p-5 space-y-3 sm:space-y-4 transition-all hover:shadow-xl hover:shadow-black/30`}>

      {/* First Row: Odds (top right) | Edit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-lg font-semibold text-foreground">
            {betTypeTitle}
          </div>
          {bet.boostPercentage && bet.boostPercentage > 0 && (
            <Badge variant="secondary" className={`text-xs ${badgeColorClass}`}>
              {bet.boostPercentage}% boost
            </Badge>
          )}
          {bet.isNoSweat && (
            <Badge variant="secondary" className={`text-xs ${badgeColorClass}`}>
              No Sweat
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">{formatOdds(bet.odds, format, bet.result)}</div>
          <Link href={`/bets/${bet.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-primary hover:text-primary/80">
              <Pencil className="h-4 w-4 mr-1" />
              <span className="text-xs hidden sm:inline">Edit</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Legs stacked vertically on left - show all legs from all leg groups */}
      <div className="space-y-2">
        {bet.legGroups.map((legGroup, groupIndex) => (
          <div key={legGroup.id} className="space-y-3">
            {groupIndex > 0 && (
              <div className="my-3 border-t border-border/50" />
            )}
            {legGroup.legs.map((leg) => (
              <LegCard key={leg.id} leg={leg} />
            ))}
          </div>
        ))}
      </div>

      {/* Wager and Payout info */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm text-muted-foreground">
          Wager: <span className="font-semibold text-foreground">${bet.wager.toFixed(2)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {returnedInfo.label}{" "}
          <span className={`font-semibold ${returnedInfo.color}`}>${returnedInfo.amount}</span>
        </div>
      </div>

      {/* Event names at bottom left - show unique event names */}
      {bet.legGroups.length > 0 && (() => {
        const eventNames = new Set(
          bet.legGroups
            .flatMap((group) => group.legs.map((leg) => leg.eventName))
            .filter((name): name is string => Boolean(name))
        );
        return eventNames.size > 0 ? (
          <div className="text-xs text-muted-foreground pt-2">
            {Array.from(eventNames).join(", ")}
          </div>
        ) : null;
      })()}
    </div>
  );
}


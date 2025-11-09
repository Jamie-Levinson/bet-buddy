"use client";

import { formatEventDate, getBorderColorClass, formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { useUser } from "@/lib/user-context";
import { formatMarketDisplay } from "@/lib/market-helpers";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface LegCardProps {
  leg: SerializedBetWithLegs["legs"][number];
}

export function LegCard({ leg }: LegCardProps) {
  const borderColorClass = getBorderColorClass(leg.result);
  const { format } = useOddsFormat();
  const profile = useUser();
  const userTimezone = profile.timezone;

  // use legacy leg description first for backwards compatibility
  const displayDescription = leg.description || 
    (leg.market ? formatMarketDisplay(
      leg.market,
      leg.playerId ? undefined : null, // Would need player name, but we don't have it here
      leg.teamId ? undefined : null, // Would need team name, but we don't have it here
      leg.qualifier || undefined,
      leg.threshold || undefined
    ) : "Leg");

  return (
    <div className={`rounded-lg border-2 ${borderColorClass} bg-card p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{displayDescription}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {leg.eventName} • {formatEventDate(leg.eventDate, userTimezone)}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="font-semibold">{formatOdds(leg.odds, format, leg.result)}</div>
        </div>
      </div>
    </div>
  );
}


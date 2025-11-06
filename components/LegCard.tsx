"use client";

import { formatEventDate, getBorderColorClass } from "@/lib/bet-helpers";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface LegCardProps {
  leg: SerializedBetWithLegs["legs"][number];
}

export function LegCard({ leg }: LegCardProps) {
  const borderColorClass = getBorderColorClass(leg.result);

  return (
    <div className={`rounded-lg border-2 ${borderColorClass} bg-card p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{leg.description}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {leg.eventName} • {formatEventDate(leg.eventDate)}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="font-semibold">{leg.odds.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}


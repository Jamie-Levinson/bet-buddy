"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { BetResultEditor } from "@/components/BetResultEditor";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface BetListProps {
  bets: SerializedBetWithLegs[];
  total: number;
  page: number;
  totalPages: number;
}

export function BetList({ bets, total, page, totalPages }: BetListProps) {
  const [filterResult, setFilterResult] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredBets = bets.filter((bet) => {
    if (filterResult !== "all" && bet.result !== filterResult) return false;
    if (filterType !== "all" && bet.betType !== filterType) return false;
    return true;
  });

  const getResultColor = (result: string) => {
    switch (result) {
      case "win":
        return "bg-green-500";
      case "loss":
        return "bg-red-500";
      case "void":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "pending":
        return "Unsettled";
      default:
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
  };

  const calculateProfit = (bet: SerializedBetWithLegs) => {
    if (bet.result === "pending") {
      return null; // No profit calculation for pending bets
    }
    if (bet.result === "win") {
      return bet.payout - bet.wager;
    } else if (bet.result === "loss") {
      return -bet.wager;
    }
    return 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bets</CardTitle>
        <CardDescription>Total: {total} bets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by result" />
            </SelectTrigger>
              <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="pending">Unsettled</SelectItem>
              <SelectItem value="win">Win</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="same_game_parlay">Same Game Parlay</SelectItem>
              <SelectItem value="parlay">Parlay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Wager</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Legs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No bets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBets.map((bet) => {
                  const profit = calculateProfit(bet);
                  const legsByEvent = bet.legs.reduce((acc, leg) => {
                    if (!acc[leg.eventName]) {
                      acc[leg.eventName] = [];
                    }
                    acc[leg.eventName].push(leg);
                    return acc;
                  }, {} as Record<string, typeof bet.legs>);

                  return (
                    <TableRow key={bet.id}>
                      <TableCell>{format(new Date(bet.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bet.betType.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>${bet.wager.toFixed(2)}</TableCell>
                      <TableCell>${bet.payout.toFixed(2)}</TableCell>
                      <TableCell>{bet.odds.toFixed(2)}</TableCell>
                      <TableCell>
                        <BetResultEditor betId={bet.id} currentResult={bet.result} />
                      </TableCell>
                      <TableCell className={
                        profit === null || bet.result === "pending" 
                          ? "text-muted-foreground" 
                          : profit >= 0 
                            ? "text-green-600" 
                            : "text-red-600"
                      }>
                        {profit === null || bet.result === "pending" ? (
                          "-"
                        ) : (
                          <>
                            ${profit >= 0 ? "+" : ""}
                            {profit.toFixed(2)}
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(legsByEvent).map(([eventName, legs]) => (
                            <div key={eventName} className="text-xs">
                              <span className="font-medium">{eventName}:</span> {legs.length} leg{legs.length > 1 ? "s" : ""}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/bets/${bet.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit bet</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/bets?page=${page - 1}`}>
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/bets?page=${page + 1}`}>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


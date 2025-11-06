"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BetCard } from "@/components/BetCard";
import type { SerializedBetWithLegs } from "@/lib/serialize";

interface BetListProps {
  bets: SerializedBetWithLegs[];
  total: number;
  page: number;
  totalPages: number;
}

export function BetList({ bets, total, page, totalPages }: BetListProps) {
  const [showOpen, setShowOpen] = useState(true);
  const [showSettled, setShowSettled] = useState(false);

  // Sort bets: by date descending, then by createdAt descending
  const sortedBets = useMemo(() => {
    return [...bets].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      return createdAtB - createdAtA;
    });
  }, [bets]);

  // Filter bets based on checkboxes
  const filteredBets = useMemo(() => {
    return sortedBets.filter((bet) => {
      const isPending = bet.result === "pending";
      const isSettled = bet.result !== "pending";
      
      if (showOpen && isPending) return true;
      if (showSettled && isSettled) return true;
      
      return false;
    });
  }, [sortedBets, showOpen, showSettled]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bets</CardTitle>
        <CardDescription>Total: {total} bets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showOpen"
              checked={showOpen}
              onCheckedChange={(checked) => setShowOpen(checked === true)}
            />
            <Label htmlFor="showOpen" className="cursor-pointer font-normal">
              Open
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showSettled"
              checked={showSettled}
              onCheckedChange={(checked) => setShowSettled(checked === true)}
            />
            <Label htmlFor="showSettled" className="cursor-pointer font-normal">
              Settled
            </Label>
          </div>
        </div>

        {filteredBets.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No bets found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
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


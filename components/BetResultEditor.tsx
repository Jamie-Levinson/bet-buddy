"use client";

import { useState } from "react";
import { updateBetResult } from "@/actions/bet-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface BetResultEditorProps {
  betId: string;
  currentResult: "pending" | "win" | "loss" | "void";
}

export function BetResultEditor({ betId, currentResult }: BetResultEditorProps) {
  const [result, setResult] = useState(currentResult);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleChange = async (newResult: string) => {
    if (newResult === result || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateBetResult(betId, newResult as "pending" | "win" | "loss" | "void");
      setResult(newResult as typeof result);
      router.refresh();
    } catch (error) {
      console.error("Failed to update bet result:", error);
      // Revert on error
      setResult(currentResult);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select value={result} onValueChange={handleChange} disabled={isUpdating}>
      <SelectTrigger className="h-8 w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Unsettled</SelectItem>
        <SelectItem value="win">Win</SelectItem>
        <SelectItem value="loss">Loss</SelectItem>
        <SelectItem value="void">Void</SelectItem>
      </SelectContent>
    </Select>
  );
}



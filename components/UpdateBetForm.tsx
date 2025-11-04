"use client";

import { BetForm } from "./BetForm";
import { updateBet } from "@/actions/bet-actions";
import { useRouter } from "next/navigation";
import { type BetFormData } from "@/lib/validations/bet";

interface UpdateBetFormProps {
  betId: string;
  defaultValues: Partial<BetFormData>;
}

export function UpdateBetForm({ betId, defaultValues }: UpdateBetFormProps) {
  const router = useRouter();

  async function handleSubmit(data: BetFormData) {
    await updateBet(betId, data);
    router.push(`/bets/${betId}`);
    router.refresh();
  }

  return <BetForm onSubmit={handleSubmit} defaultValues={defaultValues} />;
}


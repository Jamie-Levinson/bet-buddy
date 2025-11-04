"use client";

import { BetForm } from "./BetForm";
import { createBet } from "@/actions/bet-actions";
import { useRouter } from "next/navigation";
import { type BetFormData } from "@/lib/validations/bet";

export function CreateBetForm() {
  const router = useRouter();

  async function handleSubmit(data: BetFormData) {
    await createBet(data);
    router.push("/dashboard");
    router.refresh();
  }

  return <BetForm onSubmit={handleSubmit} />;
}


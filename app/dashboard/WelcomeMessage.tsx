"use client";

import { useUser } from "@/lib/user-context";

interface WelcomeMessageProps {
  userEmail: string;
}

export function WelcomeMessage({ userEmail }: WelcomeMessageProps) {
  const profile = useUser();
  return <>{profile.nickname || userEmail}</>;
}


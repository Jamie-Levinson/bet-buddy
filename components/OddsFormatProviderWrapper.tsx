"use client";

import { OddsFormatProvider } from "@/lib/odds-format-context";

export function OddsFormatProviderWrapper({ children }: { children: React.ReactNode }) {
  return <OddsFormatProvider>{children}</OddsFormatProvider>;
}


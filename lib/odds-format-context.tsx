"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { updateOddsFormat } from "@/actions/account-actions";

type OddsFormat = "decimal" | "american";

interface OddsFormatContextType {
  format: OddsFormat;
  setFormat: (format: OddsFormat) => void;
  toggleFormat: () => void;
}

const OddsFormatContext = createContext<OddsFormatContextType | undefined>(undefined);

export function OddsFormatProvider({
  children,
  initialFormat,
}: {
  children: ReactNode;
  initialFormat?: OddsFormat;
}) {
  const [format, setFormatState] = useState<OddsFormat>(initialFormat || "decimal");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from prop on mount
  useEffect(() => {
    setIsMounted(true);
    if (initialFormat) {
      setFormatState(initialFormat);
    }
  }, [initialFormat]);

  const setFormat = async (newFormat: OddsFormat) => {
    const previousFormat = format;
    setFormatState(newFormat);
    // Save to user profile
    try {
      await updateOddsFormat(newFormat);
    } catch (error) {
      console.error("Failed to update odds format:", error);
      // Revert on error
      setFormatState(previousFormat);
    }
  };

  const toggleFormat = () => {
    const newFormat = format === "decimal" ? "american" : "decimal";
    setFormat(newFormat);
  };

  return (
    <OddsFormatContext.Provider value={{ format, setFormat, toggleFormat }}>
      {children}
    </OddsFormatContext.Provider>
  );
}

export function useOddsFormat() {
  const context = useContext(OddsFormatContext);
  if (context === undefined) {
    throw new Error("useOddsFormat must be used within an OddsFormatProvider");
  }
  return context;
}


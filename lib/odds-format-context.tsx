"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type OddsFormat = "decimal" | "american";

interface OddsFormatContextType {
  format: OddsFormat;
  setFormat: (format: OddsFormat) => void;
  toggleFormat: () => void;
}

const OddsFormatContext = createContext<OddsFormatContextType | undefined>(undefined);

const STORAGE_KEY = "betbuddy-odds-format";

export function OddsFormatProvider({ children }: { children: ReactNode }) {
  const [format, setFormatState] = useState<OddsFormat>("decimal");
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "american" || stored === "decimal") {
      setFormatState(stored);
    }
  }, []);

  // Sync to localStorage when format changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, format);
    }
  }, [format, isMounted]);

  const setFormat = (newFormat: OddsFormat) => {
    setFormatState(newFormat);
  };

  const toggleFormat = () => {
    setFormatState((prev) => (prev === "decimal" ? "american" : "decimal"));
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


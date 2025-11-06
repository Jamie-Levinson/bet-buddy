"use client";

import { useOddsFormat } from "@/lib/odds-format-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OddsFormatSelector() {
  const { format, setFormat } = useOddsFormat();

  return (
    <Select value={format} onValueChange={(value) => setFormat(value as "decimal" | "american")}>
      <SelectTrigger className="min-h-[44px] whitespace-nowrap">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="decimal">Decimal</SelectItem>
        <SelectItem value="american">American</SelectItem>
      </SelectContent>
    </Select>
  );
}


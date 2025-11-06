"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { calculateBetOdds, calculateBetResult, americanToDecimal, formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface BetFormProps {
  onSubmit: (data: BetFormData) => Promise<void>;
  defaultValues?: Partial<BetFormData>;
}

export function BetForm({ onSubmit, defaultValues }: BetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { format } = useOddsFormat();
  const [oddsInputs, setOddsInputs] = useState<Record<number, string>>({});

  // Auto-detect odds format and conditionally validate based on format
  const parseOddsInput = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    
    const trimmed = value.trim();
    
    if (trimmed.startsWith("+") || trimmed.startsWith("-")) {
      const numberPart = trimmed.slice(1);
      
      if (numberPart.length < 3 || !/^\d+$/.test(numberPart)) {
        return 0; // Invalid - return 0 so it's filtered out
      }
      
      try {
        return americanToDecimal(trimmed);
      } catch {
        return 0;
      }
    }
    
    const decimal = parseFloat(trimmed);
    return isNaN(decimal) || decimal <= 0 ? 0 : decimal;
  };

  const handleOddsChange = (index: number, value: string) => {
    setOddsInputs((prev) => ({ ...prev, [index]: value }));
    const decimalValue = parseOddsInput(value);
    setValue(`legs.${index}.odds`, decimalValue, { shouldValidate: true });
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BetFormData>({
    resolver: zodResolver(betFormSchema) as any,
    defaultValues: {
      isBonusBet: false,
      isNoSweat: false,
      legs: [{ description: "", eventName: "", odds: 0, result: "pending" }],
      date: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "legs",
  });

  const legs = useWatch({ control, name: "legs" });
  const wager = useWatch({ control, name: "wager" });
  const isBonusBet = useWatch({ control, name: "isBonusBet" });
  const boostPercentage = useWatch({ control, name: "boostPercentage" });
  const isNoSweat = useWatch({ control, name: "isNoSweat" });

  // Initialize odds inputs from defaultValues
  useEffect(() => {
    if (defaultValues?.legs) {
      const initialInputs: Record<number, string> = {};
      defaultValues.legs.forEach((leg, index) => {
        if (leg.odds) {
          initialInputs[index] = leg.odds.toString();
        }
      });
      setOddsInputs(initialInputs);
    }
  }, [defaultValues]);

  const calculatedBetType = useMemo(() => {
    if (!legs || legs.length === 0) return null;
    if (legs.length === 1) return "straight";
    const uniqueEvents = new Set(legs.map((leg) => leg.eventName).filter(Boolean));
    if (uniqueEvents.size === 1) return "same_game_parlay";
    return "parlay";
  }, [legs]);

  const calculatedOdds = useMemo(() => {
    if (!legs || legs.length === 0) return 0;
    return calculateBetOdds(legs);
  }, [legs]);

  const calculatedBetResult = useMemo(() => {
    if (!legs || legs.length === 0) return "pending" as const;
    return calculateBetResult(legs);
  }, [legs]);

  const calculatedPayout = useMemo(() => {
    if (!wager || calculatedOdds === 0) return 0;
    const basePayout = wager * calculatedOdds;
    
    if (isBonusBet) {
      return basePayout - wager; // Profit only
    } else if (boostPercentage) {
      return basePayout * (1 + boostPercentage / 100);
    } else {
      return basePayout;
    }
  }, [wager, calculatedOdds, isBonusBet, boostPercentage]);

  const onFormSubmit = async (data: BetFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBetTypeLabel = (type: string | null) => {
    switch (type) {
      case "straight":
        return "Straight";
      case "same_game_parlay":
        return "Same Game Parlay";
      case "parlay":
        return "Parlay";
      default:
        return "Unknown";
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Legs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bet Legs</CardTitle>
          <CardDescription>
            Add the legs of your bet. The bet type will be automatically detected based on the number of legs and events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="glass-card space-y-4 rounded-lg p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Leg {index + 1}</h3>
                {fields.length > 1 && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    //clean up input state for removed index
                    onClick={() => {
                      remove(index);
                      setOddsInputs((prev) => {
                        const newInputs = { ...prev };
                        delete newInputs[index];
                        return newInputs;
                      });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`legs.${index}.description`}>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`legs.${index}.description`}
                  placeholder="e.g., Lakers -5.5, Over 220.5 points"
                  className={errors.legs?.[index]?.description ? "border-destructive" : ""}
                  {...register(`legs.${index}.description`)}
                />
                {errors.legs?.[index]?.description && (
                  <p className="text-sm text-destructive">{errors.legs[index]?.description?.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`legs.${index}.eventName`}>
                    Event Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`legs.${index}.eventName`}
                    placeholder="e.g., Lakers vs Warriors"
                    className={errors.legs?.[index]?.eventName ? "border-destructive" : ""}
                    {...register(`legs.${index}.eventName`)}
                  />
                  {errors.legs?.[index]?.eventName && (
                    <p className="text-sm text-destructive">{errors.legs[index]?.eventName?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`legs.${index}.odds`}>
                    Odds <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`legs.${index}.odds`}
                    type="text"
                    placeholder="e.g., 1.85 or +150"
                    value={oddsInputs[index] ?? (legs?.[index]?.odds ? legs[index].odds.toString() : "")}
                    onChange={(e) => handleOddsChange(index, e.target.value)}
                    className={errors.legs?.[index]?.odds ? "border-destructive" : ""}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter decimal (e.g., 1.85) or American (e.g., +150, -200)
                  </p>
                  {errors.legs?.[index]?.odds && (
                    <p className="text-sm text-destructive">{errors.legs[index]?.odds?.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`legs.${index}.result`}>
                  Leg Result
                </Label>
                <Select
                  value={legs?.[index]?.result || "pending"}
                  onValueChange={(value) => setValue(`legs.${index}.result`, value as "pending" | "win" | "loss" | "void")}
                >
                  <SelectTrigger id={`legs.${index}.result`} className={errors.legs?.[index]?.result ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Unsettled</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
                {errors.legs?.[index]?.result && (
                  <p className="text-sm text-destructive">{errors.legs[index]?.result?.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The bet result will be calculated automatically based on leg results.
                </p>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({ description: "", eventName: "", odds: 0, result: "pending" });
              setOddsInputs((prev) => {
                const newInputs = { ...prev };
                newInputs[fields.length] = "";
                return newInputs;
              });
            }}
            className="w-full"
          >
            Add Leg
          </Button>
        </CardContent>
      </Card>

      {/* Bet Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bet Details</CardTitle>
          <CardDescription>Enter the wager and date for your bet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wager">
                Wager ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wager"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={errors.wager ? "border-destructive" : ""}
                onWheel={(e) => e.currentTarget.blur()}
                {...register("wager")}
              />
              {errors.wager && <p className="text-sm text-destructive">{errors.wager.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                className={errors.date ? "border-destructive" : ""}
                {...register("date")}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Values Display */}
      {(calculatedBetType || calculatedOdds > 0 || (wager && calculatedPayout > 0)) && (
        <Card className="glow-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Calculated Values</span>
              <Badge variant="secondary" className="text-xs">Auto-calculated</Badge>
            </CardTitle>
            <CardDescription>These values update automatically as you enter your bet details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {calculatedBetType && (
                <div className="glass-card space-y-2 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Bet Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-base px-3 py-1.5 font-semibold">
                      {getBetTypeLabel(calculatedBetType)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {calculatedBetType === "straight" 
                      ? "Single leg bet"
                      : calculatedBetType === "same_game_parlay"
                        ? "Multiple legs from same event"
                        : "Multiple legs from different events"}
                  </p>
                </div>
              )}

                    {(calculatedOdds > 1 || calculatedBetResult === "void") && (
                <div className="glass-card space-y-2 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Total Odds</Label>
                  <div className="text-3xl font-bold">
                    {formatOdds(calculatedOdds, format, calculatedBetResult)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {calculatedBetResult === "void" 
                      ? "All legs are void"
                      : legs.filter((leg) => leg.odds && leg.odds !== 0).length > 1 
                        ? `Product of ${legs.filter((leg) => leg.odds && leg.odds !== 0).length} legs` 
                        : "Single leg odds"}
                  </p>
                </div>
              )}

              {wager && Number(wager) > 0 && calculatedPayout > 0 && (
                <div className="glass-card space-y-2 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Potential Payout</Label>
                  <div className="text-3xl font-bold text-win-green">
                    ${calculatedPayout.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isBonusBet && "Profit only (no stake returned)"}
                    {boostPercentage && !isBonusBet && `${boostPercentage}% boost applied`}
                    {!isBonusBet && !boostPercentage && "Includes stake"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modifiers Section */}
      <Card>
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
          <CardDescription>Additional bet characteristics that affect payout calculation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBonusBet"
              checked={isBonusBet}
              onCheckedChange={(checked) => setValue("isBonusBet", checked === true)}
            />
            <Label htmlFor="isBonusBet" className="cursor-pointer">
              Bonus Bet (placed with credits - profit only, no stake returned)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boostPercentage">Boost Percentage (Optional)</Label>
            <Input
              id="boostPercentage"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="Leave empty for no boost, or enter 25, 30, 50, etc."
              {...register("boostPercentage")}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no boost. Enter a percentage (e.g., 40 for 40% boost). The payout will be multiplied by (1 + boost% / 100).
            </p>
            {errors.boostPercentage && (
              <p className="text-sm text-destructive">{errors.boostPercentage.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNoSweat"
              checked={isNoSweat}
              onCheckedChange={(checked) => setValue("isNoSweat", checked === true)}
            />
            <Label htmlFor="isNoSweat" className="cursor-pointer">
              No Sweat (refund as bonus bets if the bet loses)
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting} size="lg" className="min-h-[44px] min-w-[120px]">
          {isSubmitting ? "Saving..." : "Save Bet"}
        </Button>
      </div>
    </form>
  );
}

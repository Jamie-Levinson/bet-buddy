"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { calculateBetOddsFromGroups, calculateBetResultFromGroups, americanToDecimal, formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { useUser } from "@/lib/user-context";
import { type GameWithTeams, type PlayerOption } from "@/actions/game-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { EventForm } from "@/components/EventForm";

interface BetFormProps {
  onSubmit: (data: BetFormData) => Promise<void>;
  defaultValues?: Partial<BetFormData>;
}

export function BetForm({ onSubmit, defaultValues }: BetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { format } = useOddsFormat();
  const [oddsInputs, setOddsInputs] = useState<Record<string, string>>({}); // eventIndex -> odds string
  
  // State for games and players per leg (groupIndex-legIndex)
  const [gamesByLeg, setGamesByLeg] = useState<Record<string, GameWithTeams[]>>({});
  const [playersByLeg, setPlayersByLeg] = useState<Record<string, PlayerOption[]>>({});
  const [loadingGames, setLoadingGames] = useState<Record<string, boolean>>({});
  const [loadingPlayers, setLoadingPlayers] = useState<Record<string, boolean>>({});
  // Track which league/date combination was used for caching
  const [gamesCacheKey, setGamesCacheKey] = useState<Record<string, string>>({});

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

  const handleOddsChange = (eventIndex: number, value: string) => {
    setOddsInputs((prev) => ({ ...prev, [eventIndex]: value }));
    const decimalValue = parseOddsInput(value);
    setValue(`events.${eventIndex}.odds`, decimalValue, { shouldValidate: true });
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<BetFormData>({
    resolver: zodResolver(betFormSchema) as any,
    defaultValues: (() => {
      const today = new Date().toISOString().split("T")[0];
      // Convert defaultValues.legGroups to events if needed (for editing existing bets)
      let processedEvents = (defaultValues as any)?.events;
      if (!processedEvents && defaultValues?.legGroups) {
        // Convert legGroups to events (one legGroup = one event)
        processedEvents = defaultValues.legGroups.map((group: any) => ({
          gameId: group.gameId || "",
          odds: group.odds || 0,
          legs: group.legs || [],
        }));
      }
      if (!processedEvents && (defaultValues as any)?.legs) {
        // Convert old legs format to events
        const oldLegs = (defaultValues as any).legs;
        processedEvents = [{
          gameId: oldLegs[0]?.gameId || "",
          odds: oldLegs[0]?.odds || 0,
          legs: oldLegs.map((leg: any) => ({
            ...leg,
            date: leg.date || today,
          })),
        }];
      }
      if (!processedEvents || processedEvents.length === 0) {
        processedEvents = [{
          gameId: "",
          odds: 0,
          legs: [{
            league: undefined as any,
            gameId: "",
            market: undefined as any,
            playerId: undefined,
            teamId: undefined,
            qualifier: undefined as any,
            threshold: undefined,
            date: today,
            result: "pending",
          }],
        }];
      }
      
      return {
        isBonusBet: false,
        isNoSweat: false,
        ...defaultValues,
        events: processedEvents,
      };
    })(),
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control,
    name: "events",
  });

  const events = useWatch({ control, name: "events" });
  const wager = useWatch({ control, name: "wager" });
  const isBonusBet = useWatch({ control, name: "isBonusBet" });
  const boostPercentage = useWatch({ control, name: "boostPercentage" });
  const isNoSweat = useWatch({ control, name: "isNoSweat" });
  const sportsbook = useWatch({ control, name: "sportsbook" });

  // Get user timezone from context
  const profile = useUser();
  const userTimezone = profile.timezone;

  // Games and players fetching is now handled in LegForm component

  // Initialize odds inputs from defaultValues
  useEffect(() => {
    const eventsData = (defaultValues as any)?.events || defaultValues?.legGroups;
    if (eventsData) {
      const initialInputs: Record<string, string> = {};
      eventsData.forEach((item: any, index: number) => {
        if (item.odds) {
          initialInputs[index] = item.odds.toString();
        }
      });
      setOddsInputs(initialInputs);
    }
  }, [defaultValues]);

  const calculatedBetType = useMemo(() => {
    if (!events || events.length === 0) return null;
    if (events.length === 1) {
      const event = events[0];
      if (event.legs.length === 1) return "straight";
      return "same_game_parlay";
    }
    // Multiple events - check if all same game
    const uniqueGames = new Set(events.map((e) => e.gameId).filter(Boolean));
    if (uniqueGames.size === 1) return "same_game_parlay_plus";
    return "parlay";
  }, [events]);

  const calculatedOdds = useMemo(() => {
    if (!events || events.length === 0) return 0;
    return calculateBetOddsFromGroups(events.map((e) => ({ odds: e.odds })));
  }, [events]);

  const calculatedBetResult = useMemo(() => {
    if (!events || events.length === 0) return "pending" as const;
    return calculateBetResultFromGroups(
      events.map((e) => ({ legs: e.legs.map((l) => ({ result: l.result })) }))
    );
  }, [events]);

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
      case "same_game_parlay_plus":
        return "Same Game Parlay+";
      case "parlay":
        return "Parlay";
      default:
        return "Unknown";
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Events Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bet Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventFields.map((eventField, eventIndex) => (
            <div key={eventField.id}>
              {eventIndex > 0 && (
                <div className="my-6 border-t border-border/50" />
              )}
              <EventForm
                control={control}
                eventIndex={eventIndex}
                eventFields={eventFields}
                removeEvent={(index) => {
                  removeEvent(index);
                  setOddsInputs((prev) => {
                    const newInputs = { ...prev };
                    delete newInputs[index];
                    return newInputs;
                  });
                }}
                oddsInputs={oddsInputs}
                handleOddsChange={handleOddsChange}
                errors={errors}
                gamesByLeg={gamesByLeg}
                playersByLeg={playersByLeg}
                loadingGames={loadingGames}
                loadingPlayers={loadingPlayers}
                setGamesByLeg={setGamesByLeg}
                setPlayersByLeg={setPlayersByLeg}
                setLoadingGames={setLoadingGames}
                setLoadingPlayers={setLoadingPlayers}
                setGamesCacheKey={setGamesCacheKey}
                gamesCacheKey={gamesCacheKey}
                userTimezone={userTimezone}
                setValue={setValue}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              appendEvent({
                gameId: "",
                odds: 0,
                legs: [{
                  league: undefined as any,
                  gameId: "",
                  market: undefined as any,
                  playerId: undefined,
                  teamId: undefined,
                  qualifier: undefined as any,
                  threshold: undefined,
                  date: today,
                  result: "pending",
                }],
              });
              setOddsInputs((prev) => {
                const newInputs = { ...prev };
                newInputs[eventFields.length] = "";
                return newInputs;
              });
            }}
            className="w-full"
          >
            Add leg from another game
          </Button>
        </CardContent>
      </Card>

      {/* Bet Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bet Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isBonusBet"
              checked={isBonusBet}
              onCheckedChange={(checked) => setValue("isBonusBet", checked === true)}
            />
            <Label htmlFor="isBonusBet" className="cursor-pointer">
              Bonus Bet
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
              No Sweat
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sportsbook">Sportsbook (Optional)</Label>
            <Select
              value={sportsbook || ""}
              onValueChange={(value) => setValue("sportsbook", (value || undefined) as BetFormData["sportsbook"])}
            >
              <SelectTrigger id="sportsbook">
                <SelectValue placeholder="Select sportsbook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fanduel">FanDuel</SelectItem>
                <SelectItem value="draftkings">DraftKings</SelectItem>
                <SelectItem value="bet365">Bet365</SelectItem>
                <SelectItem value="caesars">Caesars</SelectItem>
                <SelectItem value="mgm">MGM</SelectItem>
                <SelectItem value="pointsbet">PointsBet</SelectItem>
                <SelectItem value="betmgm">BetMGM</SelectItem>
                <SelectItem value="unibet">Unibet</SelectItem>
              </SelectContent>
            </Select>
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
                </div>
              )}

                    {(calculatedOdds > 1 || calculatedBetResult === "void") && (
                <div className="glass-card space-y-2 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Total Odds</Label>
                  <div className="text-3xl font-bold">
                    {formatOdds(calculatedOdds, format, calculatedBetResult)}
                  </div>
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

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting} size="lg" className="min-h-[44px] min-w-[120px]">
          {isSubmitting ? "Saving..." : "Save Bet"}
        </Button>
      </div>
    </form>
  );
}

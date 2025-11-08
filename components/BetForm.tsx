"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { betFormSchema, type BetFormData } from "@/lib/validations/bet";
import { calculateBetOdds, calculateBetResult, americanToDecimal, formatOdds } from "@/lib/bet-helpers";
import { useOddsFormat } from "@/lib/odds-format-context";
import { getGamesByLeagueAndDate, getPlayersByGame, type GameWithTeams, type PlayerOption } from "@/actions/game-actions";
import { isPlayerMarket, isTeamMarket, isSpreadMarket, requiresQualifier, getMarketsForLeague, getMarketLabel } from "@/lib/market-helpers";
import { LeagueEnum, Market, MarketQualifier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BetFormProps {
  onSubmit: (data: BetFormData) => Promise<void>;
  defaultValues?: Partial<BetFormData>;
}

export function BetForm({ onSubmit, defaultValues }: BetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { format } = useOddsFormat();
  const [oddsInputs, setOddsInputs] = useState<Record<number, string>>({});
  
  // State for games and players per leg
  const [gamesByLeg, setGamesByLeg] = useState<Record<number, GameWithTeams[]>>({});
  const [playersByLeg, setPlayersByLeg] = useState<Record<number, PlayerOption[]>>({});
  const [loadingGames, setLoadingGames] = useState<Record<number, boolean>>({});
  const [loadingPlayers, setLoadingPlayers] = useState<Record<number, boolean>>({});
  // Track which league/date combination was used for caching
  const [gamesCacheKey, setGamesCacheKey] = useState<Record<number, string>>({});

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
        legs: [{
          league: undefined as any,
          gameId: "",
          market: undefined as any,
          playerId: undefined,
          teamId: undefined,
          qualifier: undefined as any,
          threshold: undefined,
          odds: 0,
          result: "pending",
        }],
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
  const betDate = useWatch({ control, name: "date" });

  // Fetch games when league/date changes for each leg
  useEffect(() => {
    const fetchGamesForLegs = async () => {
      for (let i = 0; i < (legs?.length || 0); i++) {
        const leg = legs?.[i];
        if (leg?.league && betDate) {
          // Parse date string (YYYY-MM-DD) to local date, avoiding timezone issues
          const [year, month, day] = betDate.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const cacheKey = `${i}-${leg.league}-${betDate}`;
          
          // Check if we need to fetch (no cache or cache is for different league/date)
          const currentCacheKey = gamesCacheKey[i];
          const needsFetch = !currentCacheKey || currentCacheKey !== cacheKey;
          
          if (needsFetch) {
            setLoadingGames((prev) => ({ ...prev, [i]: true }));
            try {
              const games = await getGamesByLeagueAndDate(leg.league, date);
              setGamesByLeg((prev) => ({ ...prev, [i]: games }));
              setGamesCacheKey((prev) => ({ ...prev, [i]: cacheKey }));
            } catch (error) {
              console.error(`Error fetching games for leg ${i}:`, error);
              setGamesByLeg((prev) => ({ ...prev, [i]: [] }));
              setGamesCacheKey((prev) => ({ ...prev, [i]: cacheKey }));
            } finally {
              setLoadingGames((prev) => ({ ...prev, [i]: false }));
            }
          }
        } else {
          // Clear games if league or date is cleared
          if (gamesByLeg[i]) {
            setGamesByLeg((prev) => {
              const newState = { ...prev };
              delete newState[i];
              return newState;
            });
            setGamesCacheKey((prev) => {
              const newState = { ...prev };
              delete newState[i];
              return newState;
            });
          }
        }
      }
    };

    fetchGamesForLegs();
  }, [legs?.map(l => `${l?.league}`).join(','), betDate]);

  // Fetch players when game changes for each leg
  useEffect(() => {
    const fetchPlayersForLegs = async () => {
      for (let i = 0; i < (legs?.length || 0); i++) {
        const leg = legs?.[i];
        if (leg?.gameId) {
          // Only fetch if we don't have players cached for this leg
          if (!playersByLeg[i] || playersByLeg[i].length === 0) {
            setLoadingPlayers((prev) => ({ ...prev, [i]: true }));
            try {
              const players = await getPlayersByGame(leg.gameId);
              setPlayersByLeg((prev) => ({ ...prev, [i]: players }));
            } catch (error) {
              console.error(`Error fetching players for leg ${i}:`, error);
              setPlayersByLeg((prev) => ({ ...prev, [i]: [] }));
            } finally {
              setLoadingPlayers((prev) => ({ ...prev, [i]: false }));
            }
          }
        } else {
          // Clear players if game is cleared
          if (playersByLeg[i]) {
            setPlayersByLeg((prev) => {
              const newState = { ...prev };
              delete newState[i];
              return newState;
            });
          }
        }
      }
    };

    fetchPlayersForLegs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legs?.map(l => l?.gameId).join(',')]);

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
    // Use gameId instead of eventName for determining same game parlay
    const uniqueGames = new Set(legs.map((leg) => leg.gameId).filter(Boolean));
    if (uniqueGames.size === 1) return "same_game_parlay";
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

              {/* Cascading Selectors */}
              <div className="space-y-4">
                {/* League Selector */}
                <div className="space-y-2">
                  <Label htmlFor={`legs.${index}.league`}>
                    League <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={legs?.[index]?.league || ""}
                      onValueChange={(value) => {
                        setValue(`legs.${index}.league`, value as LeagueEnum);
                        setValue(`legs.${index}.gameId`, "");
                        setValue(`legs.${index}.market`, undefined as any);
                        setValue(`legs.${index}.playerId`, undefined);
                        setValue(`legs.${index}.teamId`, undefined);
                        setValue(`legs.${index}.qualifier`, undefined as any);
                        setValue(`legs.${index}.threshold`, undefined);
                        // Clear cached games/players
                        setGamesByLeg((prev) => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                        setGamesCacheKey((prev) => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                        setPlayersByLeg((prev) => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                      }}
                  >
                    <SelectTrigger id={`legs.${index}.league`} className={errors.legs?.[index]?.league ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select league" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeagueEnum.NBA}>NBA</SelectItem>
                      <SelectItem value={LeagueEnum.NFL}>NFL</SelectItem>
                      <SelectItem value={LeagueEnum.NHL}>NHL</SelectItem>
                      <SelectItem value={LeagueEnum.MLB}>MLB</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.legs?.[index]?.league && (
                    <p className="text-sm text-destructive">{errors.legs[index]?.league?.message}</p>
                  )}
                </div>

                {/* Date Selector - uses bet date, but can be overridden per leg if needed */}
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={betDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setValue("date", e.target.value);
                      // Clear games when date changes
                      setGamesByLeg((prev) => {
                        const newState = { ...prev };
                        delete newState[index];
                        return newState;
                      });
                      setGamesCacheKey((prev) => {
                        const newState = { ...prev };
                        delete newState[index];
                        return newState;
                      });
                    }}
                    className="w-full"
                  />
                </div>

                {/* Event Selector */}
                {legs?.[index]?.league && betDate && (
                  <div className="space-y-2">
                    <Label htmlFor={`legs.${index}.gameId`}>
                      Event <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={legs?.[index]?.gameId || ""}
                      onValueChange={(value) => {
                        setValue(`legs.${index}.gameId`, value);
                        setValue(`legs.${index}.playerId`, undefined);
                        setValue(`legs.${index}.teamId`, undefined);
                        // Clear cached players
                        setPlayersByLeg((prev) => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                      }}
                      disabled={loadingGames[index]}
                    >
                      <SelectTrigger id={`legs.${index}.gameId`} className={errors.legs?.[index]?.gameId ? "border-destructive" : ""}>
                        <SelectValue placeholder={loadingGames[index] ? "Loading games..." : "Select event"} />
                      </SelectTrigger>
                      <SelectContent>
                        {gamesByLeg[index]?.map((game) => (
                          <SelectItem key={game.id} value={game.id}>
                            {game.awayTeam.name} vs {game.homeTeam.name}
                            {game.startTime && ` • ${new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </SelectItem>
                        ))}
                        {(!gamesByLeg[index] || gamesByLeg[index].length === 0) && !loadingGames[index] && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No games found for this date
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.legs?.[index]?.gameId && (
                      <p className="text-sm text-destructive">{errors.legs[index]?.gameId?.message}</p>
                    )}
                  </div>
                )}

                {/* Market Selector */}
                {legs?.[index]?.league && (
                  <div className="space-y-2">
                    <Label htmlFor={`legs.${index}.market`}>
                      Market <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={legs?.[index]?.market || ""}
                      onValueChange={(value) => {
                        setValue(`legs.${index}.market`, value as Market);
                        // Clear dependent fields when market changes
                        setValue(`legs.${index}.playerId`, undefined);
                        setValue(`legs.${index}.teamId`, undefined);
                        setValue(`legs.${index}.qualifier`, undefined as any);
                        setValue(`legs.${index}.threshold`, undefined);
                      }}
                    >
                      <SelectTrigger id={`legs.${index}.market`} className={errors.legs?.[index]?.market ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select market" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMarketsForLeague(legs[index].league).map((market) => {
                          const marketLabel = getMarketLabel(market);
                          return (
                            <SelectItem key={market} value={market}>
                              {marketLabel}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.legs?.[index]?.market && (
                      <p className="text-sm text-destructive">{errors.legs[index]?.market?.message}</p>
                    )}
                  </div>
                )}

                {/* Team Selector - conditional (for team markets) */}
                {legs?.[index]?.market && isTeamMarket(legs[index].market) && legs?.[index]?.gameId && gamesByLeg[index] && (
                  <div className="space-y-2">
                    <Label htmlFor={`legs.${index}.teamId`}>
                      Team <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={legs?.[index]?.teamId || ""}
                      onValueChange={(value) => setValue(`legs.${index}.teamId`, value)}
                    >
                      <SelectTrigger id={`legs.${index}.teamId`} className={errors.legs?.[index]?.teamId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {gamesByLeg[index] && gamesByLeg[index].length > 0 && (
                          <>
                            <SelectItem value={gamesByLeg[index][0].awayTeam.id}>
                              {gamesByLeg[index][0].awayTeam.name}
                            </SelectItem>
                            <SelectItem value={gamesByLeg[index][0].homeTeam.id}>
                              {gamesByLeg[index][0].homeTeam.name}
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.legs?.[index]?.teamId && (
                      <p className="text-sm text-destructive">{errors.legs[index]?.teamId?.message}</p>
                    )}
                  </div>
                )}

                {/* Player Selector - conditional */}
                {legs?.[index]?.market && isPlayerMarket(legs[index].market) && legs?.[index]?.gameId && (
                  <div className="space-y-2">
                    <Label htmlFor={`legs.${index}.playerId`}>
                      Player <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={legs?.[index]?.playerId || ""}
                      onValueChange={(value) => setValue(`legs.${index}.playerId`, value)}
                      disabled={loadingPlayers[index]}
                    >
                      <SelectTrigger id={`legs.${index}.playerId`} className={errors.legs?.[index]?.playerId ? "border-destructive" : ""}>
                        <SelectValue placeholder={loadingPlayers[index] ? "Loading players..." : "Select player"} />
                      </SelectTrigger>
                      <SelectContent>
                        {playersByLeg[index]?.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.fullName}
                            {player.position && ` (${player.position})`}
                          </SelectItem>
                        ))}
                        {(!playersByLeg[index] || playersByLeg[index].length === 0) && !loadingPlayers[index] && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No players found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.legs?.[index]?.playerId && (
                      <p className="text-sm text-destructive">{errors.legs[index]?.playerId?.message}</p>
                    )}
                  </div>
                )}

                {/* Threshold Input (for spread markets, can be negative or positive) */}
                {legs?.[index]?.market && isSpreadMarket(legs[index].market) && legs?.[index]?.teamId && (
                  <div className="space-y-2">
                    <Label htmlFor={`legs.${index}.threshold`}>
                      Differential <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`legs.${index}.threshold`}
                      type="number"
                      step="0.5"
                      placeholder="e.g., -1.5 or +2.5"
                      value={legs?.[index]?.threshold !== undefined && legs[index].threshold !== null ? legs[index].threshold.toString() : ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        setValue(`legs.${index}.threshold`, value, { shouldValidate: true });
                      }}
                      className={errors.legs?.[index]?.threshold ? "border-destructive" : ""}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Negative means favorite (e.g., -1.5), positive means underdog (e.g., +2.5)
                    </p>
                    {errors.legs?.[index]?.threshold && (
                      <p className="text-sm text-destructive">{errors.legs[index]?.threshold?.message}</p>
                    )}
                  </div>
                )}

                {/* Over/Under Selector */}
                {legs?.[index]?.market && requiresQualifier(legs[index].market) && !isSpreadMarket(legs[index].market) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`legs.${index}.qualifier`}>
                        Over/Under <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={legs?.[index]?.qualifier || ""}
                        onValueChange={(value) => {
                          setValue(`legs.${index}.qualifier`, value as MarketQualifier);
                          if (value === MarketQualifier.NONE) {
                            setValue(`legs.${index}.threshold`, undefined);
                          }
                        }}
                      >
                        <SelectTrigger id={`legs.${index}.qualifier`} className={errors.legs?.[index]?.qualifier ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select over/under" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MarketQualifier.OVER}>Over</SelectItem>
                          <SelectItem value={MarketQualifier.UNDER}>Under</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.legs?.[index]?.qualifier && (
                        <p className="text-sm text-destructive">{errors.legs[index]?.qualifier?.message}</p>
                      )}
                    </div>

                    {/* Threshold Input (for over/under markets, must be positive) */}
                    {legs?.[index]?.qualifier && legs[index].qualifier !== MarketQualifier.NONE && (
                      <div className="space-y-2">
                        <Label htmlFor={`legs.${index}.threshold`}>
                          Threshold <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`legs.${index}.threshold`}
                          type="number"
                          step="0.5"
                          min="0.5"
                          placeholder="e.g., 9.5"
                          value={legs?.[index]?.threshold || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            setValue(`legs.${index}.threshold`, value, { shouldValidate: true });
                          }}
                          className={errors.legs?.[index]?.threshold ? "border-destructive" : ""}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        {errors.legs?.[index]?.threshold && (
                          <p className="text-sm text-destructive">{errors.legs[index]?.threshold?.message}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Odds Input */}
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
              append({
                league: undefined as any,
                gameId: "",
                market: undefined as any,
                playerId: undefined,
                teamId: undefined,
                qualifier: undefined as any,
                threshold: undefined,
                odds: 0,
                result: "pending",
              });
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

"use client";

import { useFieldArray, useWatch, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { LeagueEnum, Market, MarketQualifier } from "@prisma/client";
import { formatDateInTimezone } from "@/lib/timezone-helpers";
import { isPlayerMarket, isTeamMarket, isSpreadMarket, requiresQualifier, getMarketsForLeague, getMarketLabel } from "@/lib/market-helpers";
import { getGamesByLeagueAndDate, getPlayersByGame, type GameWithTeams, type PlayerOption } from "@/actions/game-actions";
import { useEffect } from "react";
import type { BetFormData } from "@/lib/validations/bet";

interface EventFormProps {
  control: Control<BetFormData>;
  eventIndex: number;
  eventFields: any[];
  removeEvent: (index: number) => void;
  oddsInputs: Record<string, string>;
  handleOddsChange: (eventIndex: number, value: string) => void;
  errors: any;
  gamesByLeg: Record<string, GameWithTeams[]>;
  playersByLeg: Record<string, PlayerOption[]>;
  loadingGames: Record<string, boolean>;
  loadingPlayers: Record<string, boolean>;
  setGamesByLeg: React.Dispatch<React.SetStateAction<Record<string, GameWithTeams[]>>>;
  setPlayersByLeg: React.Dispatch<React.SetStateAction<Record<string, PlayerOption[]>>>;
  setLoadingGames: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setLoadingPlayers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setGamesCacheKey: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  gamesCacheKey: Record<string, string>;
  userTimezone: string;
  setValue: any;
}

export function EventForm({
  control,
  eventIndex,
  eventFields,
  removeEvent,
  oddsInputs,
  handleOddsChange,
  errors,
  gamesByLeg,
  playersByLeg,
  loadingGames,
  loadingPlayers,
  setGamesByLeg,
  setPlayersByLeg,
  setLoadingGames,
  setLoadingPlayers,
  setGamesCacheKey,
  gamesCacheKey,
  userTimezone,
  setValue,
}: EventFormProps) {
  const { fields: legFields, append: appendLeg, remove: removeLeg } = useFieldArray({
    control,
    name: `events.${eventIndex}.legs`,
  });

  const events = useWatch({ control, name: "events" });
  const event = events?.[eventIndex];

  // Get the first leg's league/date for event-level game selection
  const firstLeg = event?.legs?.[0];
  const eventLeague = firstLeg?.league;
  const eventDate = firstLeg?.date || new Date().toISOString().split("T")[0];
  const eventGameId = event?.gameId;

  return (
    <div className="space-y-4">
      {/* Legs within this event */}
      <div className="space-y-4">
        {legFields.map((legField, legIndex) => {
          const legKey = `${eventIndex}-${legIndex}`;
          const leg = event?.legs?.[legIndex];
          
          return (
            <LegForm
              key={legField.id}
              control={control}
              eventIndex={eventIndex}
              legIndex={legIndex}
              legKey={legKey}
              legFields={legFields}
              removeLeg={removeLeg}
              leg={leg}
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
              eventGameId={eventGameId}
            />
          );
        })}

        <div className="space-y-4">
          {legFields.length === 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const firstLeg = event?.legs?.[0];
                appendLeg({
                  league: firstLeg?.league || eventLeague || undefined as any,
                  gameId: eventGameId || firstLeg?.gameId || "",
                  market: undefined as any,
                  playerId: undefined,
                  teamId: undefined,
                  qualifier: undefined as any,
                  threshold: undefined,
                  date: firstLeg?.date || eventDate || new Date().toISOString().split("T")[0],
                  result: "pending",
                });
              }}
            >
              Make this a same game parlay
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const firstLeg = event?.legs?.[0];
                appendLeg({
                  league: firstLeg?.league || eventLeague || undefined as any,
                  gameId: eventGameId || firstLeg?.gameId || "",
                  market: undefined as any,
                  playerId: undefined,
                  teamId: undefined,
                  qualifier: undefined as any,
                  threshold: undefined,
                  date: firstLeg?.date || eventDate || new Date().toISOString().split("T")[0],
                  result: "pending",
                });
              }}
            >
              Add leg to this game
            </Button>
          )}
          
          {/* Odds Input - always shown, positioned directly under button */}
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.odds`}>
              Odds <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`events.${eventIndex}.odds`}
              type="text"
              placeholder="e.g., 1.85 or +150"
              value={oddsInputs[eventIndex] ?? (event?.odds ? event.odds.toString() : "")}
              onChange={(e) => handleOddsChange(eventIndex, e.target.value)}
              className={errors.events?.[eventIndex]?.odds ? "border-destructive" : ""}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {errors.events?.[eventIndex]?.odds && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.odds?.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LegFormProps {
  control: Control<BetFormData>;
  eventIndex: number;
  legIndex: number;
  legKey: string;
  legFields: any[];
  removeLeg: (index: number) => void;
  leg: any;
  errors: any;
  gamesByLeg: Record<string, GameWithTeams[]>;
  playersByLeg: Record<string, PlayerOption[]>;
  loadingGames: Record<string, boolean>;
  loadingPlayers: Record<string, boolean>;
  setGamesByLeg: React.Dispatch<React.SetStateAction<Record<string, GameWithTeams[]>>>;
  setPlayersByLeg: React.Dispatch<React.SetStateAction<Record<string, PlayerOption[]>>>;
  setLoadingGames: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setLoadingPlayers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setGamesCacheKey: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  gamesCacheKey: Record<string, string>;
  userTimezone: string;
  setValue: any;
  eventGameId?: string;
}

function LegForm({
  control,
  eventIndex,
  legIndex,
  legKey,
  legFields,
  removeLeg,
  leg,
  errors,
  gamesByLeg,
  playersByLeg,
  loadingGames,
  loadingPlayers,
  setGamesByLeg,
  setPlayersByLeg,
  setLoadingGames,
  setLoadingPlayers,
  setGamesCacheKey,
  gamesCacheKey,
  userTimezone,
  setValue,
  eventGameId,
}: LegFormProps) {
  // Fetch games when league/date changes
  useEffect(() => {
    const fetchGames = async () => {
      const legDate = leg?.date || new Date().toISOString().split("T")[0];
      if (leg?.league && legDate) {
        const cacheKey = `${legKey}-${leg.league}-${legDate}`;
        const currentCacheKey = gamesCacheKey[legKey];
        const needsFetch = !currentCacheKey || currentCacheKey !== cacheKey;
        
        if (needsFetch) {
          setLoadingGames((prev) => ({ ...prev, [legKey]: true }));
          try {
            const games = await getGamesByLeagueAndDate(leg.league, legDate, userTimezone);
            setGamesByLeg((prev) => ({ ...prev, [legKey]: games }));
            setGamesCacheKey((prev) => ({ ...prev, [legKey]: cacheKey }));
          } catch (error) {
            console.error(`Error fetching games for leg ${legKey}:`, error);
            setGamesByLeg((prev) => ({ ...prev, [legKey]: [] }));
            setGamesCacheKey((prev) => ({ ...prev, [legKey]: cacheKey }));
          } finally {
            setLoadingGames((prev) => ({ ...prev, [legKey]: false }));
          }
        }
      } else {
        if (gamesByLeg[legKey]) {
          setGamesByLeg((prev) => {
            const newState = { ...prev };
            delete newState[legKey];
            return newState;
          });
          setGamesCacheKey((prev) => {
            const newState = { ...prev };
            delete newState[legKey];
            return newState;
          });
        }
      }
    };

    if (leg) {
      fetchGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leg?.league, leg?.date, legKey, userTimezone]);

  // Fetch players when game changes
  useEffect(() => {
    const fetchPlayers = async () => {
      const gameId = eventGameId || leg?.gameId;
      if (gameId) {
        if (!playersByLeg[legKey] || playersByLeg[legKey].length === 0) {
          setLoadingPlayers((prev) => ({ ...prev, [legKey]: true }));
          try {
            const players = await getPlayersByGame(gameId);
            setPlayersByLeg((prev) => ({ ...prev, [legKey]: players }));
          } catch (error) {
            console.error(`Error fetching players for leg ${legKey}:`, error);
            setPlayersByLeg((prev) => ({ ...prev, [legKey]: [] }));
          } finally {
            setLoadingPlayers((prev) => ({ ...prev, [legKey]: false }));
          }
        }
      } else {
        if (playersByLeg[legKey]) {
          setPlayersByLeg((prev) => {
            const newState = { ...prev };
            delete newState[legKey];
            return newState;
          });
        }
      }
    };

    if (leg) {
      fetchPlayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventGameId, leg?.gameId, legKey]);

  const gameId = eventGameId || leg?.gameId;

  return (
    <div className="space-y-3">
      {legFields.length > 1 && legIndex > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Leg {legIndex + 1}</span>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              removeLeg(legIndex);
              setGamesByLeg((prev) => {
                const newState = { ...prev };
                delete newState[legKey];
                return newState;
              });
              setPlayersByLeg((prev) => {
                const newState = { ...prev };
                delete newState[legKey];
                return newState;
              });
            }}
          >
            Remove
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {/* League Selector - only show for first leg */}
        {legIndex === 0 && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.league`}>
              League <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.league || ""}
              onValueChange={(value) => {
                setValue(`events.${eventIndex}.legs.${legIndex}.league`, value as LeagueEnum);
                setValue(`events.${eventIndex}.legs.${legIndex}.gameId`, "");
                setValue(`events.${eventIndex}.legs.${legIndex}.market`, undefined as any);
                setValue(`events.${eventIndex}.legs.${legIndex}.playerId`, undefined);
                setValue(`events.${eventIndex}.legs.${legIndex}.teamId`, undefined);
                setValue(`events.${eventIndex}.legs.${legIndex}.qualifier`, undefined as any);
                setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, undefined);
              }}
            >
              <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.league`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.league ? "border-destructive" : ""}>
                <SelectValue placeholder="Select league" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeagueEnum.NBA}>NBA</SelectItem>
                <SelectItem value={LeagueEnum.NFL}>NFL</SelectItem>
                <SelectItem value={LeagueEnum.NHL}>NHL</SelectItem>
                <SelectItem value={LeagueEnum.MLB}>MLB</SelectItem>
              </SelectContent>
            </Select>
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.league && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.league?.message}</p>
            )}
          </div>
        )}

        {/* Date Selector - only show for first leg */}
        {legIndex === 0 && leg?.league && (
          <div className="space-y-2">
            <Label>Date</Label>
            <DatePicker
              value={leg?.date || new Date().toISOString().split("T")[0]}
              onChange={(value) => {
                setValue(`events.${eventIndex}.legs.${legIndex}.date`, value);
              }}
              placeholder="Pick a date"
            />
          </div>
        )}

        {/* Game Selector - only show for first leg */}
        {legIndex === 0 && leg?.league && leg?.date && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.gameId`}>
              Game <span className="text-destructive">*</span>
            </Label>
            <Select
              value={eventGameId || leg?.gameId || ""}
              onValueChange={(value) => {
                setValue(`events.${eventIndex}.legs.${legIndex}.gameId`, value);
                if (legIndex === 0) {
                  setValue(`events.${eventIndex}.gameId`, value);
                }
                // Update all legs in this event to use the same gameId
                legFields.forEach((_, idx) => {
                  if (idx !== legIndex) {
                    setValue(`events.${eventIndex}.legs.${idx}.gameId`, value);
                  }
                });
                setValue(`events.${eventIndex}.legs.${legIndex}.playerId`, undefined);
                setValue(`events.${eventIndex}.legs.${legIndex}.teamId`, undefined);
              }}
              disabled={loadingGames[legKey]}
            >
              <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.gameId`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.gameId ? "border-destructive" : ""}>
                <SelectValue placeholder={loadingGames[legKey] ? "Loading..." : "Select game"} />
              </SelectTrigger>
              <SelectContent>
                {gamesByLeg[legKey]?.map((game) => {
                  const startTimeLabel = game.startTime
                    ? formatDateInTimezone(new Date(game.startTime), userTimezone).split(", ")[1] || ""
                    : null;

                  return (
                    <SelectItem key={game.id} value={game.id}>
                      {game.awayTeam.name} vs {game.homeTeam.name}
                      {startTimeLabel ? ` • ${startTimeLabel}` : ""}
                    </SelectItem>
                  );
                })}
                {(!gamesByLeg[legKey] || gamesByLeg[legKey].length === 0) && !loadingGames[legKey] && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No games found
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.gameId && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.gameId?.message}</p>
            )}
          </div>
        )}

        {/* Market Selector */}
        {leg?.league && gameId && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.market`}>
              Market <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.market || ""}
              onValueChange={(value) => {
                setValue(`events.${eventIndex}.legs.${legIndex}.market`, value as Market);
                setValue(`events.${eventIndex}.legs.${legIndex}.playerId`, undefined);
                setValue(`events.${eventIndex}.legs.${legIndex}.teamId`, undefined);
                setValue(`events.${eventIndex}.legs.${legIndex}.qualifier`, undefined as any);
                setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, undefined);
              }}
            >
              <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.market`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.market ? "border-destructive" : ""}>
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                {getMarketsForLeague(leg.league).map((market) => {
                  const marketLabel = getMarketLabel(market);
                  return (
                    <SelectItem key={market} value={market}>
                      {marketLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.market && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.market?.message}</p>
            )}
          </div>
        )}

        {/* Team Selector */}
        {leg?.market && isTeamMarket(leg.market) && gameId && gamesByLeg[legKey] && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.teamId`}>
              Team <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.teamId || ""}
              onValueChange={(value) => setValue(`events.${eventIndex}.legs.${legIndex}.teamId`, value)}
            >
              <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.teamId`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.teamId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {gamesByLeg[legKey] && gamesByLeg[legKey].length > 0 && (
                  <>
                    <SelectItem value={gamesByLeg[legKey][0].awayTeam.id}>
                      {gamesByLeg[legKey][0].awayTeam.name}
                    </SelectItem>
                    <SelectItem value={gamesByLeg[legKey][0].homeTeam.id}>
                      {gamesByLeg[legKey][0].homeTeam.name}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.teamId && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.teamId?.message}</p>
            )}
          </div>
        )}

        {/* Player Selector */}
        {leg?.market && isPlayerMarket(leg.market) && gameId && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.playerId`}>
              Player <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.playerId || ""}
              onValueChange={(value) => setValue(`events.${eventIndex}.legs.${legIndex}.playerId`, value)}
              disabled={loadingPlayers[legKey]}
            >
              <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.playerId`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.playerId ? "border-destructive" : ""}>
                <SelectValue placeholder={loadingPlayers[legKey] ? "Loading players..." : "Select player"} />
              </SelectTrigger>
              <SelectContent>
                {playersByLeg[legKey]?.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.fullName}
                    {player.position && ` (${player.position})`}
                  </SelectItem>
                ))}
                {(!playersByLeg[legKey] || playersByLeg[legKey].length === 0) && !loadingPlayers[legKey] && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No players found
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.playerId && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.playerId?.message}</p>
            )}
          </div>
        )}

        {/* Threshold Input (for spread markets) */}
        {leg?.market && isSpreadMarket(leg.market) && leg?.teamId && (
          <div className="space-y-2">
            <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.threshold`}>
              Differential <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`events.${eventIndex}.legs.${legIndex}.threshold`}
              type="number"
              step="0.5"
              placeholder="e.g., -1.5 or +2.5"
              value={leg?.threshold !== undefined && leg.threshold !== null ? leg.threshold.toString() : ""}
              onChange={(e) => {
                const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, value, { shouldValidate: true });
              }}
              className={errors.events?.[eventIndex]?.legs?.[legIndex]?.threshold ? "border-destructive" : ""}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {errors.events?.[eventIndex]?.legs?.[legIndex]?.threshold && (
              <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.threshold?.message}</p>
            )}
          </div>
        )}

        {/* Over/Under Selector */}
        {leg?.market && requiresQualifier(leg.market) && !isSpreadMarket(leg.market) && (
          <>
            {leg?.qualifier && leg.qualifier !== MarketQualifier.NONE ? (
              <div className="flex gap-2 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.qualifier`}>
                    Over/Under <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={leg?.qualifier || ""}
                    onValueChange={(value) => {
                      setValue(`events.${eventIndex}.legs.${legIndex}.qualifier`, value as MarketQualifier);
                      if (value === MarketQualifier.NONE) {
                        setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, undefined);
                      }
                    }}
                  >
                    <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.qualifier`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.qualifier ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select over/under" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MarketQualifier.OVER}>Over</SelectItem>
                      <SelectItem value={MarketQualifier.UNDER}>Under</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.events?.[eventIndex]?.legs?.[legIndex]?.qualifier && (
                    <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.qualifier?.message}</p>
                  )}
                </div>

                {/* Threshold Input (for over/under markets) */}
                <div className="space-y-2">
                  <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.threshold`}>
                    Threshold <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`events.${eventIndex}.legs.${legIndex}.threshold`}
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="e.g., 9.5"
                    value={leg?.threshold || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                      setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, value, { shouldValidate: true });
                    }}
                    className={errors.events?.[eventIndex]?.legs?.[legIndex]?.threshold ? "border-destructive" : ""}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  {errors.events?.[eventIndex]?.legs?.[legIndex]?.threshold && (
                    <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.threshold?.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.qualifier`}>
                  Over/Under <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={leg?.qualifier || ""}
                  onValueChange={(value) => {
                    setValue(`events.${eventIndex}.legs.${legIndex}.qualifier`, value as MarketQualifier);
                    if (value === MarketQualifier.NONE) {
                      setValue(`events.${eventIndex}.legs.${legIndex}.threshold`, undefined);
                    }
                  }}
                >
                  <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.qualifier`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.qualifier ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select over/under" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MarketQualifier.OVER}>Over</SelectItem>
                  <SelectItem value={MarketQualifier.UNDER}>Under</SelectItem>
                </SelectContent>
              </Select>
              {errors.events?.[eventIndex]?.legs?.[legIndex]?.qualifier && (
                <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.qualifier?.message}</p>
              )}
            </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`events.${eventIndex}.legs.${legIndex}.result`}>
          Result
        </Label>
        <Select
          value={leg?.result || "pending"}
          onValueChange={(value) => setValue(`events.${eventIndex}.legs.${legIndex}.result`, value as "pending" | "win" | "loss" | "void")}
        >
          <SelectTrigger id={`events.${eventIndex}.legs.${legIndex}.result`} className={errors.events?.[eventIndex]?.legs?.[legIndex]?.result ? "border-destructive" : ""}>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Unsettled</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        {errors.events?.[eventIndex]?.legs?.[legIndex]?.result && (
          <p className="text-sm text-destructive">{errors.events[eventIndex]?.legs[legIndex]?.result?.message}</p>
        )}
      </div>
    </div>
  );
}


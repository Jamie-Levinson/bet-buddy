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
import { useEffect, useState } from "react";
import type { BetFormData } from "@/lib/validations/bet";

interface LegGroupFormProps {
  control: Control<BetFormData>;
  groupIndex: number;
  legGroupFields: any[];
  removeGroup: (index: number) => void;
  oddsInputs: Record<string, string>;
  handleOddsChange: (groupIndex: number, value: string) => void;
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
  setValue: any; // Use any to avoid complex type issues with nested paths
}

export function LegGroupForm({
  control,
  groupIndex,
  legGroupFields,
  removeGroup,
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
}: LegGroupFormProps) {
  const { fields: legFields, append: appendLeg, remove: removeLeg } = useFieldArray({
    control,
    name: `legGroups.${groupIndex}.legs`,
  });

  const legGroups = useWatch({ control, name: "legGroups" });
  const group = legGroups?.[groupIndex];

  return (
    <div className="glass-card space-y-4 rounded-lg p-4 sm:p-5 border-2 border-primary/20">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Leg Group {groupIndex + 1}</h3>
        {legGroupFields.length > 1 && (
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              removeGroup(groupIndex);
            }}
          >
            Remove Group
          </Button>
        )}
      </div>

      {/* Group-level Odds Input */}
      <div className="space-y-2 border-b pb-4">
        <Label htmlFor={`legGroups.${groupIndex}.odds`}>
          Group Odds <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`legGroups.${groupIndex}.odds`}
          type="text"
          placeholder="e.g., 1.85 or +150"
          value={oddsInputs[groupIndex] ?? (group?.odds ? group.odds.toString() : "")}
          onChange={(e) => handleOddsChange(groupIndex, e.target.value)}
          className={errors.legGroups?.[groupIndex]?.odds ? "border-destructive" : ""}
          onWheel={(e) => e.currentTarget.blur()}
        />
        <p className="text-xs text-muted-foreground">
          Enter decimal (e.g., 1.85) or American (e.g., +150, -200)
        </p>
        {errors.legGroups?.[groupIndex]?.odds && (
          <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.odds?.message}</p>
        )}
      </div>

      {/* Legs within this group */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Legs in this group</Label>
        </div>
        {legFields.map((legField, legIndex) => {
          const legKey = `${groupIndex}-${legIndex}`;
          const leg = group?.legs?.[legIndex];
          
          return (
            <LegForm
              key={legField.id}
              control={control}
              groupIndex={groupIndex}
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
            />
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            appendLeg({
              league: undefined as any,
              gameId: "",
              market: undefined as any,
              playerId: undefined,
              teamId: undefined,
              qualifier: undefined as any,
              threshold: undefined,
              date: today,
              result: "pending",
            });
          }}
          className="w-full"
        >
          Add Leg to Group
        </Button>
      </div>
    </div>
  );
}

interface LegFormProps {
  control: Control<BetFormData>;
  groupIndex: number;
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
  setValue: any; // Use any to avoid complex type issues with nested paths
}

function LegForm({
  control,
  groupIndex,
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

    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leg?.league, leg?.date, legKey, userTimezone]);

  // Fetch players when game changes
  useEffect(() => {
    const fetchPlayers = async () => {
      if (leg?.gameId) {
        if (!playersByLeg[legKey] || playersByLeg[legKey].length === 0) {
          setLoadingPlayers((prev) => ({ ...prev, [legKey]: true }));
          try {
            const players = await getPlayersByGame(leg.gameId);
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
  }, [leg?.gameId, legKey]);

  return (
    <div className="glass-card space-y-4 rounded-lg p-4 sm:p-5 bg-card/50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Leg {legIndex + 1}</h4>
        {legFields.length > 1 && (
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
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
            Remove Leg
          </Button>
        )}
      </div>

      {/* Cascading Selectors */}
      <div className="space-y-4">
        {/* League Selector */}
        <div className="space-y-2">
          <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.league`}>
            League <span className="text-destructive">*</span>
          </Label>
          <Select
            value={leg?.league || ""}
            onValueChange={(value) => {
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.league`, value as LeagueEnum);
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.gameId`, "");
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.market`, undefined as any);
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.playerId`, undefined);
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.teamId`, undefined);
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.qualifier`, undefined as any);
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.threshold`, undefined);
              if (legIndex === 0) {
                setValue(`legGroups.${groupIndex}.gameId`, "");
              }
            }}
          >
            <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.league`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.league ? "border-destructive" : ""}>
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LeagueEnum.NBA}>NBA</SelectItem>
              <SelectItem value={LeagueEnum.NFL}>NFL</SelectItem>
              <SelectItem value={LeagueEnum.NHL}>NHL</SelectItem>
              <SelectItem value={LeagueEnum.MLB}>MLB</SelectItem>
            </SelectContent>
          </Select>
          {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.league && (
            <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.league?.message}</p>
          )}
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <Label>Event Date</Label>
          <DatePicker
            value={leg?.date || new Date().toISOString().split("T")[0]}
            onChange={(value) => {
              setValue(`legGroups.${groupIndex}.legs.${legIndex}.date`, value);
            }}
            placeholder="Pick a date"
          />
        </div>

        {/* Event Selector */}
        {leg?.league && leg?.date && (
          <div className="space-y-2">
            <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.gameId`}>
              Event <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.gameId || ""}
              onValueChange={(value) => {
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.gameId`, value);
                if (legIndex === 0) {
                  setValue(`legGroups.${groupIndex}.gameId`, value);
                }
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.playerId`, undefined);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.teamId`, undefined);
              }}
              disabled={loadingGames[legKey]}
            >
              <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.gameId`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.gameId ? "border-destructive" : ""}>
                <SelectValue placeholder={loadingGames[legKey] ? "Loading games..." : "Select event"} />
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
                    No games found for this date. Make sure you've selected the correct year (games may be in 2025).
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.gameId && (
              <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.gameId?.message}</p>
            )}
          </div>
        )}

        {/* Market Selector */}
        {leg?.league && (
          <div className="space-y-2">
            <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.market`}>
              Market <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.market || ""}
              onValueChange={(value) => {
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.market`, value as Market);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.playerId`, undefined);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.teamId`, undefined);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.qualifier`, undefined as any);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.threshold`, undefined);
              }}
            >
              <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.market`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.market ? "border-destructive" : ""}>
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
            {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.market && (
              <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.market?.message}</p>
            )}
          </div>
        )}

        {/* Team Selector */}
        {leg?.market && isTeamMarket(leg.market) && leg?.gameId && gamesByLeg[legKey] && (
          <div className="space-y-2">
            <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.teamId`}>
              Team <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.teamId || ""}
              onValueChange={(value) => setValue(`legGroups.${groupIndex}.legs.${legIndex}.teamId`, value)}
            >
              <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.teamId`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.teamId ? "border-destructive" : ""}>
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
            {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.teamId && (
              <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.teamId?.message}</p>
            )}
          </div>
        )}

        {/* Player Selector */}
        {leg?.market && isPlayerMarket(leg.market) && leg?.gameId && (
          <div className="space-y-2">
            <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.playerId`}>
              Player <span className="text-destructive">*</span>
            </Label>
            <Select
              value={leg?.playerId || ""}
              onValueChange={(value) => setValue(`legGroups.${groupIndex}.legs.${legIndex}.playerId`, value)}
              disabled={loadingPlayers[legKey]}
            >
              <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.playerId`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.playerId ? "border-destructive" : ""}>
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
            {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.playerId && (
              <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.playerId?.message}</p>
            )}
          </div>
        )}

        {/* Threshold Input (for spread markets) */}
        {leg?.market && isSpreadMarket(leg.market) && leg?.teamId && (
          <div className="space-y-2">
            <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.threshold`}>
              Differential <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`legGroups.${groupIndex}.legs.${legIndex}.threshold`}
              type="number"
              step="0.5"
              placeholder="e.g., -1.5 or +2.5"
              value={leg?.threshold !== undefined && leg.threshold !== null ? leg.threshold.toString() : ""}
              onChange={(e) => {
                const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                setValue(`legGroups.${groupIndex}.legs.${legIndex}.threshold`, value, { shouldValidate: true });
              }}
              className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.threshold ? "border-destructive" : ""}
              onWheel={(e) => e.currentTarget.blur()}
            />
            <p className="text-xs text-muted-foreground">
              Negative means favorite (e.g., -1.5), positive means underdog (e.g., +2.5)
            </p>
            {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.threshold && (
              <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.threshold?.message}</p>
            )}
          </div>
        )}

        {/* Over/Under Selector */}
        {leg?.market && requiresQualifier(leg.market) && !isSpreadMarket(leg.market) && (
          <>
            <div className="space-y-2">
              <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.qualifier`}>
                Over/Under <span className="text-destructive">*</span>
              </Label>
              <Select
                value={leg?.qualifier || ""}
                onValueChange={(value) => {
                  setValue(`legGroups.${groupIndex}.legs.${legIndex}.qualifier`, value as MarketQualifier);
                  if (value === MarketQualifier.NONE) {
                    setValue(`legGroups.${groupIndex}.legs.${legIndex}.threshold`, undefined);
                  }
                }}
              >
                <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.qualifier`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.qualifier ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select over/under" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MarketQualifier.OVER}>Over</SelectItem>
                  <SelectItem value={MarketQualifier.UNDER}>Under</SelectItem>
                </SelectContent>
              </Select>
              {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.qualifier && (
                <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.qualifier?.message}</p>
              )}
            </div>

            {/* Threshold Input (for over/under markets) */}
            {leg?.qualifier && leg.qualifier !== MarketQualifier.NONE && (
              <div className="space-y-2">
                <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.threshold`}>
                  Threshold <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`legGroups.${groupIndex}.legs.${legIndex}.threshold`}
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g., 9.5"
                  value={leg?.threshold || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    setValue(`legGroups.${groupIndex}.legs.${legIndex}.threshold`, value, { shouldValidate: true });
                  }}
                  className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.threshold ? "border-destructive" : ""}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.threshold && (
                  <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.threshold?.message}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`legGroups.${groupIndex}.legs.${legIndex}.result`}>
          Leg Result
        </Label>
        <Select
          value={leg?.result || "pending"}
          onValueChange={(value) => setValue(`legGroups.${groupIndex}.legs.${legIndex}.result`, value as "pending" | "win" | "loss" | "void")}
        >
          <SelectTrigger id={`legGroups.${groupIndex}.legs.${legIndex}.result`} className={errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.result ? "border-destructive" : ""}>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Unsettled</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        {errors.legGroups?.[groupIndex]?.legs?.[legIndex]?.result && (
          <p className="text-sm text-destructive">{errors.legGroups[groupIndex]?.legs[legIndex]?.result?.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The bet result will be calculated automatically based on leg results.
        </p>
      </div>
    </div>
  );
}


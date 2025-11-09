-- CreateEnum
CREATE TYPE "SportEnum" AS ENUM ('BASKETBALL', 'FOOTBALL', 'BASEBALL', 'HOCKEY');

-- CreateEnum
CREATE TYPE "LeagueEnum" AS ENUM ('NBA', 'NFL', 'MLB', 'NHL');

-- CreateEnum
CREATE TYPE "Market" AS ENUM ('MONEYLINE', 'SPREAD', 'TOTAL_POINTS', 'TEAM_TOTAL_POINTS', 'TEAM_FIRST_HALF_POINTS', 'TEAM_FIRST_QUARTER_POINTS', 'TEAM_FIRST_PERIOD_GOALS', 'TEAM_FIRST_INNING_SCORE', 'TEAM_FIRST_FIVE_RUNS', 'WINNING_MARGIN', 'OVERTIME_YES_NO', 'TEAM_TO_SCORE_FIRST', 'TEAM_TO_SCORE_LAST', 'BOTH_TEAMS_TO_SCORE', 'FIRST_TO_SCORE_X_POINTS', 'PLAYER_POINTS', 'PLAYER_REBOUNDS', 'PLAYER_ASSISTS', 'PLAYER_STEALS', 'PLAYER_BLOCKS', 'PLAYER_THREES', 'PLAYER_PRA', 'PLAYER_PR', 'PLAYER_PA', 'PLAYER_RA', 'DOUBLE_DOUBLE', 'TRIPLE_DOUBLE', 'PLAYER_TURNOVERS', 'PLAYER_FANTASY_POINTS', 'TEAM_TOTAL_POINTS_NBA', 'TEAM_FIRST_HALF_POINTS_NBA', 'TEAM_FIRST_QUARTER_POINTS_NBA', 'PLAYER_PASSING_YARDS', 'PLAYER_RUSHING_YARDS', 'PLAYER_RECEIVING_YARDS', 'PLAYER_RECEPTIONS', 'PLAYER_PASSING_TDS', 'PLAYER_RUSHING_TDS', 'PLAYER_RECEIVING_TDS', 'PLAYER_ANYTIME_TD', 'PLAYER_FIRST_TD', 'PLAYER_LONGEST_RECEPTION', 'PLAYER_LONGEST_RUSH', 'PLAYER_INTERCEPTIONS', 'PLAYER_COMPLETIONS', 'PLAYER_ATTEMPTS', 'PLAYER_PASS_ATTEMPTS', 'PLAYER_PASS_COMPLETIONS', 'PLAYER_FIELD_GOALS_MADE', 'PLAYER_FIELD_GOALS_ATTEMPTED', 'PLAYER_EXTRA_POINTS_MADE', 'PLAYER_PUNTS', 'TEAM_TOTAL_POINTS_NFL', 'TEAM_FIRST_HALF_POINTS_NFL', 'TEAM_FIRST_QUARTER_POINTS_NFL', 'RUN_LINE', 'TOTAL_RUNS', 'PLAYER_HITS', 'PLAYER_HOME_RUNS', 'PLAYER_RBIS', 'PLAYER_RUNS', 'PLAYER_TOTAL_BASES', 'PLAYER_STOLEN_BASES', 'PLAYER_WALKS', 'PITCHER_STRIKEOUTS', 'PITCHER_OUTS_RECORDED', 'PITCHER_EARNED_RUNS', 'PITCHER_HITS_ALLOWED', 'PITCHER_WALKS_ALLOWED', 'TEAM_TOTAL_RUNS', 'TEAM_FIRST_FIVE_RUNS_MLB', 'TEAM_FIRST_INNING_SCORE_MLB', 'PUCK_LINE', 'TOTAL_GOALS', 'PLAYER_GOALS', 'PLAYER_ASSISTS_NHL', 'PLAYER_POINTS_NHL', 'PLAYER_SHOTS', 'PLAYER_BLOCKS_NHL', 'PLAYER_PIM', 'PLAYER_POWER_PLAY_POINTS', 'GOALIE_SAVES', 'GOALIE_SHOTS_AGAINST', 'TEAM_TOTAL_GOALS');

-- CreateEnum
CREATE TYPE "MarketQualifier" AS ENUM ('OVER', 'UNDER', 'NONE');

-- AlterTable
ALTER TABLE "legs" ADD COLUMN     "espnEventId" TEXT,
ADD COLUMN     "gameId" TEXT,
ADD COLUMN     "league" "LeagueEnum",
ADD COLUMN     "market" "Market",
ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "qualifier" "MarketQualifier",
ADD COLUMN     "sport" "SportEnum",
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "threshold" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "league" "LeagueEnum" NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "location" TEXT,
    "espnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "league" "LeagueEnum" NOT NULL,
    "teamId" TEXT,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "espnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "league" "LeagueEnum" NOT NULL,
    "espnEventId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" TEXT NOT NULL,
    "canonicalType" TEXT NOT NULL,
    "canonicalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_espnId_key" ON "Team"("espnId");

-- CreateIndex
CREATE INDEX "Team_league_idx" ON "Team"("league");

-- CreateIndex
CREATE INDEX "Team_espnId_idx" ON "Team"("espnId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_espnId_key" ON "Player"("espnId");

-- CreateIndex
CREATE INDEX "Player_league_idx" ON "Player"("league");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Player_espnId_idx" ON "Player"("espnId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_espnEventId_key" ON "Game"("espnEventId");

-- CreateIndex
CREATE INDEX "Game_league_idx" ON "Game"("league");

-- CreateIndex
CREATE INDEX "Game_startTime_idx" ON "Game"("startTime");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_idx" ON "Game"("homeTeamId");

-- CreateIndex
CREATE INDEX "Game_awayTeamId_idx" ON "Game"("awayTeamId");

-- CreateIndex
CREATE INDEX "Game_espnEventId_idx" ON "Game"("espnEventId");

-- CreateIndex
CREATE INDEX "Alias_canonicalType_canonicalId_idx" ON "Alias"("canonicalType", "canonicalId");

-- CreateIndex
CREATE INDEX "Alias_label_idx" ON "Alias"("label");

-- CreateIndex
CREATE INDEX "Alias_source_idx" ON "Alias"("source");

-- CreateIndex
CREATE INDEX "legs_playerId_idx" ON "legs"("playerId");

-- CreateIndex
CREATE INDEX "legs_teamId_idx" ON "legs"("teamId");

-- CreateIndex
CREATE INDEX "legs_market_idx" ON "legs"("market");

-- CreateIndex
CREATE INDEX "legs_gameId_idx" ON "legs"("gameId");

-- CreateIndex
CREATE INDEX "legs_espnEventId_idx" ON "legs"("espnEventId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

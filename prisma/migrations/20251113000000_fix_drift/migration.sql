-- Fix drift: Add missing columns to Game table
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "wentToOvertime" BOOLEAN DEFAULT false;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "homePeriodScores" JSONB;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "awayPeriodScores" JSONB;

-- Fix drift: Remove incorrect unique index on Team.espnId
DROP INDEX IF EXISTS "Team_espnId_key";

-- Fix drift: Ensure composite unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS "Team_espnId_league_key" ON "Team"("espnId", "league");

-- Fix drift: Ensure foreign key exists
ALTER TABLE "bets" DROP CONSTRAINT IF EXISTS "bets_user_id_fkey";
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix drift: Update users.updated_at default (Prisma handles @updatedAt differently)
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

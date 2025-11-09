-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "preferredOddsFormat" TEXT NOT NULL DEFAULT 'decimal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create user records for all existing user IDs in bets table
INSERT INTO "users" ("id", "email", "timezone", "preferredOddsFormat", "created_at", "updated_at")
SELECT DISTINCT 
    "user_id" as "id",
    COALESCE("user_id", '') as "email", -- Use user_id as email placeholder for now
    'America/New_York' as "timezone",
    'decimal' as "preferredOddsFormat",
    CURRENT_TIMESTAMP as "created_at",
    CURRENT_TIMESTAMP as "updated_at"
FROM "bets"
WHERE "user_id" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

-- Step 3: Create index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "Team_espnId_league_key" ON "Team"("espnId", "league");

-- Step 4: Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bets_user_id_fkey'
    ) THEN
        ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

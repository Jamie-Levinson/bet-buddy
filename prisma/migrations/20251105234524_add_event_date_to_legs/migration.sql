-- Add the column as nullable first
ALTER TABLE "legs" ADD COLUMN "event_date" TIMESTAMP(3);

-- Set event_date to bet.date for existing rows
UPDATE "legs" SET "event_date" = (
  SELECT "date" FROM "bets" WHERE "bets"."id" = "legs"."bet_id"
);

-- Now make it NOT NULL
ALTER TABLE "legs" ALTER COLUMN "event_date" SET NOT NULL;

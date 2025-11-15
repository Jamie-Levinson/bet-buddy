-- AlterEnum
ALTER TYPE "BetType" ADD VALUE 'same_game_parlay_plus';

-- Drop RLS policies that depend on bet_id
DROP POLICY IF EXISTS "Users can read own bet legs" ON "legs";
DROP POLICY IF EXISTS "Users can create legs for own bets" ON "legs";
DROP POLICY IF EXISTS "Users can update own bet legs" ON "legs";
DROP POLICY IF EXISTS "Users can delete own bet legs" ON "legs";

-- DropForeignKey
ALTER TABLE "public"."legs" DROP CONSTRAINT "legs_bet_id_fkey";

-- DropIndex
DROP INDEX "public"."legs_bet_id_idx";

-- AlterTable
ALTER TABLE "legs" DROP COLUMN "bet_id",
DROP COLUMN "odds",
ADD COLUMN     "leg_group_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "leg_groups" (
    "id" TEXT NOT NULL,
    "bet_id" TEXT NOT NULL,
    "odds" DECIMAL(10,2) NOT NULL,
    "game_id" TEXT,
    "order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leg_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leg_groups_bet_id_idx" ON "leg_groups"("bet_id");

-- CreateIndex
CREATE INDEX "leg_groups_game_id_idx" ON "leg_groups"("game_id");

-- CreateIndex
CREATE INDEX "legs_leg_group_id_idx" ON "legs"("leg_group_id");

-- AddForeignKey
ALTER TABLE "leg_groups" ADD CONSTRAINT "leg_groups_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leg_groups" ADD CONSTRAINT "leg_groups_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_leg_group_id_fkey" FOREIGN KEY ("leg_group_id") REFERENCES "leg_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate RLS policies using leg_group_id instead of bet_id
CREATE POLICY "Users can read own bet legs" ON "legs"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "leg_groups" lg
      JOIN "bets" b ON lg."bet_id" = b."id"
      WHERE lg."id" = "legs"."leg_group_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create legs for own bets" ON "legs"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "leg_groups" lg
      JOIN "bets" b ON lg."bet_id" = b."id"
      WHERE lg."id" = "legs"."leg_group_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own bet legs" ON "legs"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "leg_groups" lg
      JOIN "bets" b ON lg."bet_id" = b."id"
      WHERE lg."id" = "legs"."leg_group_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own bet legs" ON "legs"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "leg_groups" lg
      JOIN "bets" b ON lg."bet_id" = b."id"
      WHERE lg."id" = "legs"."leg_group_id"
      AND b."user_id" = auth.uid()::text
    )
  );

-- Create RLS policies for leg_groups table
CREATE POLICY "Users can read own bet leg groups" ON "leg_groups"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "bets" b
      WHERE b."id" = "leg_groups"."bet_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can create leg groups for own bets" ON "leg_groups"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "bets" b
      WHERE b."id" = "leg_groups"."bet_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own bet leg groups" ON "leg_groups"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "bets" b
      WHERE b."id" = "leg_groups"."bet_id"
      AND b."user_id" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own bet leg groups" ON "leg_groups"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "bets" b
      WHERE b."id" = "leg_groups"."bet_id"
      AND b."user_id" = auth.uid()::text
    )
  );

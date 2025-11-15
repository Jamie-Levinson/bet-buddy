-- Fix updated_at default value for leg_groups
ALTER TABLE "leg_groups" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- Create RLS policies for leg_groups table (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leg_groups' 
    AND policyname = 'Users can read own bet leg groups'
  ) THEN
    CREATE POLICY "Users can read own bet leg groups" ON "leg_groups"
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM "bets" b
          WHERE b."id" = "leg_groups"."bet_id"
          AND b."user_id" = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leg_groups' 
    AND policyname = 'Users can create leg groups for own bets'
  ) THEN
    CREATE POLICY "Users can create leg groups for own bets" ON "leg_groups"
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "bets" b
          WHERE b."id" = "leg_groups"."bet_id"
          AND b."user_id" = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leg_groups' 
    AND policyname = 'Users can update own bet leg groups'
  ) THEN
    CREATE POLICY "Users can update own bet leg groups" ON "leg_groups"
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM "bets" b
          WHERE b."id" = "leg_groups"."bet_id"
          AND b."user_id" = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'leg_groups' 
    AND policyname = 'Users can delete own bet leg groups'
  ) THEN
    CREATE POLICY "Users can delete own bet leg groups" ON "leg_groups"
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM "bets" b
          WHERE b."id" = "leg_groups"."bet_id"
          AND b."user_id" = auth.uid()::text
        )
      );
  END IF;
END $$;

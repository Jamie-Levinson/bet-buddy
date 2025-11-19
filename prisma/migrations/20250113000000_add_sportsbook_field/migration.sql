-- AlterTable
ALTER TABLE "bets" ADD COLUMN     "sportsbook" TEXT;

-- CreateIndex
CREATE INDEX "bets_sportsbook_idx" ON "bets"("sportsbook");

-- CreateIndex
CREATE INDEX "bets_user_id_sportsbook_idx" ON "bets"("user_id", "sportsbook");


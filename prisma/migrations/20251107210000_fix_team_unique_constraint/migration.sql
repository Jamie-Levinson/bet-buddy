-- AlterTable
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_espnId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Team_espnId_league_key" ON "Team"("espnId", "league");


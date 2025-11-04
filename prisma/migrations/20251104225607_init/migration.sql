-- CreateEnum
CREATE TYPE "BetResult" AS ENUM ('win', 'loss', 'void');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('straight', 'same_game_parlay', 'parlay');

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "wager" DECIMAL(10,2) NOT NULL,
    "payout" DECIMAL(10,2) NOT NULL,
    "odds" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "result" "BetResult" NOT NULL,
    "bet_type" "BetType" NOT NULL,
    "is_bonus_bet" BOOLEAN NOT NULL DEFAULT false,
    "boost_percentage" INTEGER,
    "is_no_sweat" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legs" (
    "id" TEXT NOT NULL,
    "bet_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "odds" DECIMAL(10,2) NOT NULL,
    "result" "BetResult" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bets_user_id_idx" ON "bets"("user_id");

-- CreateIndex
CREATE INDEX "bets_date_idx" ON "bets"("date");

-- CreateIndex
CREATE INDEX "legs_bet_id_idx" ON "legs"("bet_id");

-- CreateIndex
CREATE INDEX "legs_event_name_idx" ON "legs"("event_name");

-- AddForeignKey
ALTER TABLE "legs" ADD CONSTRAINT "legs_bet_id_fkey" FOREIGN KEY ("bet_id") REFERENCES "bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

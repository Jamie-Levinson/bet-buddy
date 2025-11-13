/**
 * Check Database Drift
 * 
 * Compares schema.prisma to actual database state.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDrift() {
  try {
    // Check users table structure
    const usersColumns = await prisma.$queryRaw<Array<{ column_name: string; column_default: string | null }>>`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'updated_at';
    `;
    
    console.log("Users table updated_at column:");
    console.log(usersColumns);

    // Check foreign keys on bets table
    const fks = await prisma.$queryRaw<Array<{ conname: string; contype: string }>>`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'bets'::regclass 
      AND contype = 'f';
    `;
    
    console.log("\nForeign keys on bets table:");
    console.log(fks);

    // Check if bets_user_id_fkey exists
    const userFk = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bets_user_id_fkey'
      ) as exists;
    `;
    
    console.log("\nDoes bets_user_id_fkey exist?");
    console.log(userFk);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkDrift()
  .finally(() => {
    prisma.$disconnect();
  });



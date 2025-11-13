/**
 * Test Database Connection
 * 
 * Simple script to verify database connectivity.
 * 
 * Usage: tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function testConnection() {
  console.log("Testing database connection...\n");

  try {
    // Test 1: Simple query
    console.log("1. Testing simple query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("   ✓ Query successful:", result);

    // Test 2: Check tables
    console.log("\n2. Checking tables...");
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log(`   ✓ Found ${tables.length} tables:`);
    tables.forEach((t) => console.log(`      - ${t.tablename}`));

    // Test 3: Check migrations
    console.log("\n3. Checking migrations...");
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name 
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC
      LIMIT 5;
    `;
    console.log(`   ✓ Found ${migrations.length} migrations:`);
    migrations.forEach((m) => console.log(`      - ${m.migration_name}`));

    console.log("\n" + "=".repeat(60));
    console.log("✓ Database connection successful!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n✗ Database connection failed:");
    console.error(error instanceof Error ? error.message : error);
    
    if (error instanceof Error) {
      if (error.message.includes("P1001")) {
        console.error("\n💡 This is a connection error. Check:");
        console.error("   - DATABASE_URL is set correctly in .env");
        console.error("   - Database is accessible");
        console.error("   - Connection pooler isn't blocking connections");
      } else if (error.message.includes("P1003")) {
        console.error("\n💡 Database doesn't exist or schema is missing.");
      }
    }
    
    process.exit(1);
  }
}

testConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });



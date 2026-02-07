/**
 * Better Auth Database Migration
 * Creates the core tables required by Better Auth v1.4.x in PostgreSQL.
 *
 * Tables: user, session, account, verification
 * Column names use camelCase (Better Auth's Kysely adapter quotes them).
 *
 * Usage: node scripts/migrate-better-auth.js
 */

const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_KTx1RBnEFIP8@ep-nameless-sunset-a7rqrhit-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });

const MIGRATION_SQL = `
-- Better Auth core tables for PostgreSQL
-- Column names are camelCase (quoted) to match Better Auth's Kysely adapter

CREATE TABLE IF NOT EXISTS "user" (
    "id"              TEXT PRIMARY KEY,
    "name"            TEXT NOT NULL,
    "email"           TEXT NOT NULL UNIQUE,
    "emailVerified"   BOOLEAN NOT NULL DEFAULT FALSE,
    "image"           TEXT,
    "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    "id"              TEXT PRIMARY KEY,
    "userId"          TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token"           TEXT NOT NULL UNIQUE,
    "expiresAt"       TIMESTAMP NOT NULL,
    "ipAddress"       TEXT,
    "userAgent"       TEXT,
    "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
    "id"                      TEXT PRIMARY KEY,
    "userId"                  TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accountId"               TEXT NOT NULL,
    "providerId"              TEXT NOT NULL,
    "accessToken"             TEXT,
    "refreshToken"            TEXT,
    "accessTokenExpiresAt"    TIMESTAMP,
    "refreshTokenExpiresAt"   TIMESTAMP,
    "scope"                   TEXT,
    "idToken"                 TEXT,
    "password"                TEXT,
    "createdAt"               TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id"              TEXT PRIMARY KEY,
    "identifier"      TEXT NOT NULL,
    "value"           TEXT NOT NULL,
    "expiresAt"       TIMESTAMP NOT NULL,
    "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");
`;

async function migrate() {
  console.log("Connecting to database...");
  const client = await pool.connect();

  try {
    // Check existing tables
    const before = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log(
      "Tables before migration:",
      before.rows.map((r) => r.tablename)
    );

    // Run migration
    console.log("\nRunning Better Auth migration...");
    await client.query(MIGRATION_SQL);
    console.log("Migration completed successfully.");

    // Verify tables
    const after = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log(
      "\nTables after migration:",
      after.rows.map((r) => r.tablename)
    );

    // Verify column structure of user table
    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'user' AND table_schema = 'public'
       ORDER BY ordinal_position`
    );
    console.log("\n'user' table columns:");
    cols.rows.forEach((c) =>
      console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`)
    );
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

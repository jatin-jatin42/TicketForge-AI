import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function fixPartitionTable() {
  console.log('🔧 Checking event_seats partition setup...');

  try {
    // ── Step 0: Ensure the enum type exists (drizzle-kit push may not always create it first) ──
    await db.execute(sql.raw(`
      DO $$ BEGIN
        CREATE TYPE "seat_status" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `));

    // ── Step 1: Check if table already exists and is already partitioned ──
    const result = await db.execute(sql.raw(`
      SELECT relkind FROM pg_class
      WHERE relname = 'event_seats' AND relnamespace = 'public'::regnamespace
    `));

    const rows = result.rows as { relkind: string }[];

    if (rows.length > 0 && rows[0].relkind === 'p') {
      console.log('✅ event_seats is already partitioned — skipping.');
      return;
    }

    // ── Step 2: Drop existing non-partitioned table (if any) ──
    if (rows.length > 0) {
      console.log('1. Dropping existing non-partitioned event_seats table...');
      await db.execute(sql.raw('DROP TABLE IF EXISTS "event_seats" CASCADE'));
    } else {
      console.log('1. No existing event_seats table found — will create fresh.');
    }

    // ── Step 3: Recreate as partitioned ──
    console.log('2. Creating partitioned event_seats table...');
    await db.execute(sql.raw(`
      CREATE TABLE "event_seats" (
        "event_id"   uuid NOT NULL,
        "seat_id"    uuid NOT NULL,
        "section_id" uuid NOT NULL,
        "user_id"    uuid,
        "status"     "seat_status" DEFAULT 'AVAILABLE' NOT NULL,
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "event_seats_pk" PRIMARY KEY ("event_id", "seat_id")
      ) PARTITION BY LIST ("event_id")
    `));

    // ── Step 4: Create index ──
    console.log('3. Creating index on event_seats...');
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS "idx_event_seats_lookup"
      ON "event_seats" ("event_id", "section_id", "status")
    `));

    console.log('✅ event_seats table is now partitioned!');

  } catch (error: any) {
    // Non-fatal: log the error but do NOT exit(1) so the server can still start
    console.warn('⚠️  Partition setup encountered an issue (non-fatal):', error.message);
    console.warn('   The server will still start. You can re-run db:setup-partitions manually.');
  }
}

fixPartitionTable().then(() => process.exit(0));

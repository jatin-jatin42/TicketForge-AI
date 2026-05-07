#!/bin/sh
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      TicketForge API — Starting Up       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── Step 1: Push schema to database ───────────────────────────────────────
echo "📦 [1/4] Syncing database schema (drizzle-kit push)..."
npx drizzle-kit push
echo "✅ Schema sync complete."
echo ""

# ─── Step 2: Setup partitioned tables ──────────────────────────────────────
echo "🔧 [2/4] Setting up partitioned tables..."
node -e "require('tsx/cjs'); require('./scripts/fix-partition-table.ts')" 2>/dev/null \
  || npx tsx scripts/fix-partition-table.ts
echo "✅ Partitions ready."
echo ""

# ─── Step 3: Seed (only if RUN_SEED=true or first deploy) ──────────────────
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 [3/4] Seeding database (RUN_SEED=true)..."
  npx tsx src/db/seed.ts
  echo "✅ Seeding complete."
else
  echo "⏭️  [3/4] Skipping seed (set RUN_SEED=true in env to enable)."
fi
echo ""

# ─── Step 4: Start the API server ──────────────────────────────────────────
echo "🚀 [4/4] Starting API server..."
exec node dist/index.js

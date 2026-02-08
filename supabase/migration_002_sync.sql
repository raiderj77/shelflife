-- ============================================
-- ShelfLife — Sync Support Migration
-- ============================================
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Adds columns needed for two-way offline sync.
-- ============================================

-- Add updated_at to plays table (currently only has created_at)
ALTER TABLE plays ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill: set updated_at = created_at for existing rows
UPDATE plays SET updated_at = created_at WHERE updated_at IS NOT NULL;

-- Auto-update trigger for plays.updated_at
CREATE TRIGGER plays_updated_at
  BEFORE UPDATE ON plays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add soft-delete columns for sync deletion tracking
ALTER TABLE collection_games ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE plays ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for sync queries (fetch changes since last sync)
CREATE INDEX IF NOT EXISTS idx_collection_updated ON collection_games(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_plays_updated ON plays(user_id, updated_at);

-- ============================================
-- Done! Sync support columns added. 🎲
-- ============================================

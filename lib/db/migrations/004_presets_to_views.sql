-- Migration: Rename Filter Presets to Views and add advanced features
-- Date: 2025-10-19
-- Description:
--   - Rename filter_presets table to views
--   - Add snapshot capabilities
--   - Add public sharing via links
--   - Add session binding

-- Step 1: Rename table
ALTER TABLE filter_presets RENAME TO views;

-- Step 2: Add new columns (without UNIQUE constraint due to SQLite limitations)
ALTER TABLE views ADD COLUMN session_id TEXT;
ALTER TABLE views ADD COLUMN view_type TEXT DEFAULT 'filters_only';
ALTER TABLE views ADD COLUMN snapshot_data TEXT;
ALTER TABLE views ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE views ADD COLUMN public_link_id TEXT;
ALTER TABLE views ADD COLUMN last_accessed_at TEXT;
ALTER TABLE views ADD COLUMN access_count INTEGER DEFAULT 0;

-- Step 3: Ensure existing rows have correct view_type
UPDATE views SET view_type = 'filters_only' WHERE view_type IS NULL;
UPDATE views SET is_public = false WHERE is_public IS NULL;
UPDATE views SET access_count = 0 WHERE access_count IS NULL;

-- Step 4: Create indices for performance
CREATE INDEX IF NOT EXISTS idx_views_session_id ON views(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_views_public_link_id ON views(public_link_id) WHERE public_link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_views_is_public ON views(is_public);

-- Migration complete
-- All existing filter presets are now views of type 'filters_only'

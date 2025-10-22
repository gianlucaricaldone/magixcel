-- Migration 008: Add Default "All Data" View Support
-- Description: Adds is_default column to views table and creates "All Data" view for existing sessions

-- Step 1: Add is_default column to views table
ALTER TABLE views ADD COLUMN is_default INTEGER DEFAULT 0;

-- Step 2: Create "All Data" view for each existing session that doesn't have one
-- This ensures every session has a default view with no filters

INSERT INTO views (id, workspace_id, session_id, sheet_name, name, description, filter_config, category, is_default, created_at, updated_at)
SELECT
  'default_' || sessions.id as id,
  sessions.workspace_id,
  sessions.id as session_id,
  NULL as sheet_name,  -- Default view applies to all sheets
  'All Data' as name,
  'View all data without any filters' as description,
  '{"filters": [], "combinator": "AND"}' as filter_config,
  'System' as category,
  1 as is_default,
  datetime('now') as created_at,
  datetime('now') as updated_at
FROM sessions
WHERE NOT EXISTS (
  SELECT 1 FROM views
  WHERE views.session_id = sessions.id
  AND views.is_default = 1
);

-- Step 3: Create index on is_default for performance
CREATE INDEX IF NOT EXISTS idx_views_is_default ON views(is_default) WHERE is_default = 1;

-- Step 4: Create index on session_id + is_default for fast lookups
CREATE INDEX IF NOT EXISTS idx_views_session_default ON views(session_id, is_default);

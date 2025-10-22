-- Migration 006: Enforce View Hierarchy (CORE Structure)
-- Makes workspace_id and session_id REQUIRED in views table
-- Ensures proper hierarchy: Workspace → Session → Sheet → View → Charts

-- Step 1: Populate missing session_ids by matching workspace_id
-- For views without session_id, assign them to a session in the same workspace
UPDATE views
SET session_id = (
  SELECT s.id
  FROM sessions s
  WHERE s.workspace_id = views.workspace_id
  LIMIT 1
)
WHERE session_id IS NULL AND workspace_id IS NOT NULL;

-- Step 2: Delete orphaned views (views without valid workspace/session)
-- This should not happen in practice, but ensures data integrity
DELETE FROM views WHERE workspace_id IS NULL OR session_id IS NULL;

-- Step 3: Recreate views table with proper constraints
BEGIN TRANSACTION;

-- Rename old views table
ALTER TABLE views RENAME TO views_old;

-- Create new views table with NOT NULL constraints
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  sheet_name TEXT, -- NULL for CSV files, NOT NULL for Excel sheets
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  filter_config TEXT NOT NULL,
  view_type TEXT DEFAULT 'filters_only' CHECK(view_type IN ('filters_only', 'snapshot')),
  snapshot_data TEXT,
  is_public BOOLEAN DEFAULT false,
  public_link_id TEXT,
  dashboard_layout TEXT,
  chart_count INTEGER DEFAULT 0,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  -- Foreign keys to enforce hierarchy
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO views (
  id, workspace_id, session_id, sheet_name, name, description, category,
  filter_config, view_type, snapshot_data, is_public, public_link_id,
  dashboard_layout, chart_count, access_count, last_accessed_at,
  created_at, updated_at
)
SELECT
  id, workspace_id, session_id, sheet_name, name, description, category,
  filter_config, view_type, snapshot_data, is_public, public_link_id,
  dashboard_layout, chart_count, access_count, last_accessed_at,
  created_at, updated_at
FROM views_old;

-- Drop old table
DROP TABLE views_old;

-- Recreate indexes
CREATE INDEX idx_views_workspace_id ON views(workspace_id);
CREATE INDEX idx_views_session_id ON views(session_id);
CREATE INDEX idx_views_sheet_name ON views(session_id, sheet_name);
CREATE INDEX idx_views_name ON views(name);
CREATE INDEX idx_views_category ON views(category);
CREATE INDEX idx_views_is_public ON views(is_public);
CREATE UNIQUE INDEX idx_views_public_link_id ON views(public_link_id) WHERE public_link_id IS NOT NULL;

COMMIT;

-- Final verification: Check that all views have workspace_id and session_id
-- This query should return 0 rows
SELECT COUNT(*) as orphaned_views FROM views WHERE workspace_id IS NULL OR session_id IS NULL;

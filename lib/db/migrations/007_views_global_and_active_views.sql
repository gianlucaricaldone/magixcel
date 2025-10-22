-- Migration 007: Views globali al workspace + Active Views per foglio
--
-- BREAKING CHANGE: sheet_name rimosso da views (views ora globali al workspace)
-- Nuova tabella active_views per tracciare quali views sono attive su quale foglio

-- Step 1: Rimuovere sheet_name da views (views globali al workspace)
BEGIN TRANSACTION;

-- Rename old views table
ALTER TABLE views RENAME TO views_old;

-- Create new views table WITHOUT sheet_name
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
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

-- Copy data from old table (drop sheet_name)
INSERT INTO views (
  id, workspace_id, session_id, name, description, category,
  filter_config, view_type, snapshot_data, is_public, public_link_id,
  dashboard_layout, chart_count, access_count, last_accessed_at,
  created_at, updated_at
)
SELECT
  id, workspace_id, session_id, name, description, category,
  filter_config, view_type, snapshot_data, is_public, public_link_id,
  dashboard_layout, chart_count, access_count, last_accessed_at,
  created_at, updated_at
FROM views_old;

-- Drop old table
DROP TABLE views_old;

-- Recreate indexes
CREATE INDEX idx_views_workspace_id ON views(workspace_id);
CREATE INDEX idx_views_session_id ON views(session_id);
CREATE INDEX idx_views_name ON views(name);
CREATE INDEX idx_views_category ON views(category);
CREATE INDEX idx_views_is_public ON views(is_public);
CREATE UNIQUE INDEX idx_views_public_link_id ON views(public_link_id) WHERE public_link_id IS NOT NULL;

COMMIT;

-- Step 2: Create active_views table to track which views are active on which sheet
CREATE TABLE IF NOT EXISTS active_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL, -- Sheet name (NULL for CSV files)
  view_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),

  -- Foreign keys
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,

  -- Unique constraint: one view can be active only once per (session, sheet)
  UNIQUE(session_id, sheet_name, view_id)
);

-- Indexes for performance
CREATE INDEX idx_active_views_session_sheet ON active_views(session_id, sheet_name);
CREATE INDEX idx_active_views_view_id ON active_views(view_id);

-- Step 3: Migrate existing data if needed
-- If you had views with sheet_name before, you might want to create active_views entries
-- For now we leave this empty - users will re-activate views manually

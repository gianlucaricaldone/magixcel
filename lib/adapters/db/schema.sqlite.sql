-- MagiXcel Database Schema (SQLite - Development)
-- Compatible with Supabase PostgreSQL schema for easy migration

-- ===========================================================================
-- WORKSPACES
-- ===========================================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'dev-user', -- For development, single user
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'folder',
  is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created ON workspaces(created_at DESC);

-- ===========================================================================
-- SESSIONS (Files)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'dev-user',

  -- File Information
  name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv')),
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 for deduplication

  -- Storage Paths (R2 in prod, local in dev)
  r2_path_original TEXT NOT NULL, -- In dev: ./data/files/{id}/original.xlsx
  r2_path_parquet TEXT NOT NULL,  -- In dev: ./data/files/{id}/data.parquet

  -- Data Metadata (JSON)
  metadata TEXT NOT NULL, -- JSON: { sheets, totalRows, totalColumns, etc }

  -- Active Filters (JSON, per-sheet)
  active_filters TEXT, -- JSON: { "Sheet1": { filters, combinator }, ... }

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_accessed_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Soft delete
  deleted_at TEXT,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_workspace ON sessions(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(file_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_last_accessed ON sessions(last_accessed_at DESC);

-- ===========================================================================
-- FILTER PRESETS
-- ===========================================================================

CREATE TABLE IF NOT EXISTS filter_presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'dev-user',

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',

  -- Filter Configuration (JSON)
  filter_config TEXT NOT NULL, -- JSON: { filters: [...], combinator: "AND" }

  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TEXT,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_presets_user ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_category ON filter_presets(category);
CREATE INDEX IF NOT EXISTS idx_presets_usage ON filter_presets(use_count DESC);

-- ===========================================================================
-- VIEWS (Future implementation)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'dev-user',

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',

  -- Filter Configuration
  filter_config TEXT NOT NULL, -- JSON

  -- View Type
  view_type TEXT NOT NULL DEFAULT 'filters_only' CHECK(view_type IN ('filters_only', 'snapshot')),
  snapshot_data TEXT, -- JSON array of rows (if snapshot)

  -- Public sharing
  is_public INTEGER DEFAULT 0 CHECK(is_public IN (0, 1)),
  public_link_id TEXT UNIQUE,

  -- Default view flag
  is_default INTEGER DEFAULT 0 CHECK(is_default IN (0, 1)),

  -- Dashboard layout
  dashboard_layout TEXT, -- JSON

  -- Timestamps & Stats
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_accessed_at TEXT,
  access_count INTEGER DEFAULT 0,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_views_workspace ON views(workspace_id);
CREATE INDEX IF NOT EXISTS idx_views_session ON views(session_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON views(user_id);
CREATE INDEX IF NOT EXISTS idx_views_public ON views(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_views_public_link ON views(public_link_id) WHERE public_link_id IS NOT NULL;

-- ===========================================================================
-- VIEW CHARTS
-- ===========================================================================

CREATE TABLE IF NOT EXISTS view_charts (
  id TEXT PRIMARY KEY,
  view_id TEXT NOT NULL,

  -- Chart Configuration
  title TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON: full chart configuration
  size TEXT DEFAULT 'medium' CHECK(size IN ('small', 'medium', 'large')),
  position INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_view_charts_view ON view_charts(view_id);
CREATE INDEX IF NOT EXISTS idx_view_charts_position ON view_charts(view_id, position);

-- ===========================================================================
-- ACTIVE VIEWS (Which views are active on which sheets)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS active_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sheet_name TEXT, -- Sheet name (NULL for CSV files)
  view_id TEXT NOT NULL,

  -- Timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Foreign keys
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,

  -- Unique constraint: one view can be active only once per (session, sheet)
  UNIQUE(session_id, sheet_name, view_id)
);

CREATE INDEX IF NOT EXISTS idx_active_views_session_sheet ON active_views(session_id, sheet_name);
CREATE INDEX IF NOT EXISTS idx_active_views_view_id ON active_views(view_id);

-- ===========================================================================
-- REPORTS (Future feature)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'dev-user',

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Report Configuration (JSON)
  config TEXT NOT NULL,

  -- Output Paths
  r2_path_html TEXT,
  r2_path_ppt TEXT,
  public_url TEXT,

  -- Settings
  is_public INTEGER DEFAULT 0 CHECK(is_public IN (0, 1)),
  auto_refresh INTEGER DEFAULT 1 CHECK(auto_refresh IN (0, 1)),
  refresh_interval TEXT, -- 'hourly', 'daily', 'weekly'

  -- AI Features
  ai_insights TEXT, -- JSON
  ai_credits_used INTEGER DEFAULT 0,

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_refreshed_at TEXT,

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(is_public) WHERE is_public = 1;
CREATE INDEX IF NOT EXISTS idx_reports_refresh ON reports(last_refreshed_at) WHERE auto_refresh = 1;

-- ===========================================================================
-- EXPORTS
-- ===========================================================================

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'dev-user',

  -- Export Details
  format TEXT NOT NULL CHECK(format IN ('csv', 'xlsx', 'json', 'parquet', 'ppt')),
  r2_path TEXT NOT NULL,
  file_size INTEGER,
  row_count INTEGER,

  -- Filter State (what was exported)
  filter_config TEXT, -- JSON

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  expires_at TEXT, -- Auto-delete after X days

  -- Timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exports_session ON exports(session_id);
CREATE INDEX IF NOT EXISTS idx_exports_user ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_expires ON exports(expires_at);

-- ===========================================================================
-- MIGRATION NOTE
-- ===========================================================================
-- This schema is designed to be compatible with the Supabase PostgreSQL schema.
-- Key differences in SQLite:
--   - TEXT instead of VARCHAR, UUID
--   - INTEGER (0/1) instead of BOOLEAN
--   - TEXT instead of JSONB
--   - datetime('now') instead of NOW()
--   - No Row Level Security (handled in application layer)
--
-- When migrating to Supabase:
--   1. Export data from SQLite
--   2. Transform types (TEXT → UUID, INTEGER → BOOLEAN, TEXT → JSONB)
--   3. Import to Supabase
--   4. Enable RLS policies
-- ===========================================================================

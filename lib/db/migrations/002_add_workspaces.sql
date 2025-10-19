-- Migration: Add workspaces table and update sessions
-- This migration adds workspace support to organize sessions

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder'
);

CREATE INDEX IF NOT EXISTS idx_workspaces_created_at ON workspaces(created_at DESC);

-- Create default workspace for existing sessions
INSERT INTO workspaces (id, name, description, color, icon)
VALUES ('default', 'My Workspace', 'Default workspace for all sessions', '#3B82F6', 'folder');

-- Add workspace_id column to sessions (if not exists)
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- We'll handle this with error catching in the migration runner

-- For existing database, we need to:
-- 1. Create new sessions table with workspace_id
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- This is done via a transaction to ensure data integrity
BEGIN TRANSACTION;

-- Rename old sessions table
ALTER TABLE sessions RENAME TO sessions_old;

-- Create new sessions table with workspace_id
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  original_file_name TEXT NOT NULL,
  original_file_hash TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  column_count INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv')),
  active_filters TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Copy data from old table, assigning all to default workspace
INSERT INTO sessions (id, workspace_id, name, created_at, updated_at, original_file_name, original_file_hash, row_count, column_count, file_size, file_type, active_filters)
SELECT id, 'default', name, created_at, updated_at, original_file_name, original_file_hash, row_count, column_count, file_size, file_type, active_filters
FROM sessions_old;

-- Drop old table
DROP TABLE sessions_old;

-- Create indexes
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_file_hash ON sessions(original_file_hash);
CREATE INDEX idx_sessions_workspace_id ON sessions(workspace_id);

COMMIT;

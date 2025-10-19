-- MagiXcel Database Schema
-- SQLite version

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  original_file_name TEXT NOT NULL,
  original_file_hash TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  column_count INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv')),
  active_filters TEXT -- JSON string containing filters state per sheet
);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_file_hash ON sessions(original_file_hash);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_type TEXT NOT NULL CHECK(storage_type IN ('local', 'cloud')),
  storage_path TEXT NOT NULL,
  file_data BLOB,
  uploaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_session_id ON files(session_id);

-- Saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filter_config TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_session_id ON saved_filters(session_id);

-- Cached results table
CREATE TABLE IF NOT EXISTS cached_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  filter_hash TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  result_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cached_results_session_filter ON cached_results(session_id, filter_hash);
CREATE INDEX IF NOT EXISTS idx_cached_results_expires ON cached_results(expires_at);

-- Filter presets table (global, not session-specific)
CREATE TABLE IF NOT EXISTS filter_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  filter_config TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_filter_presets_name ON filter_presets(name);
CREATE INDEX IF NOT EXISTS idx_filter_presets_category ON filter_presets(category);

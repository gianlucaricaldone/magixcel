-- Migration 005: Add Charts to Views
-- Adds support for interactive charts and dashboard layouts

-- Create view_charts table
CREATE TABLE IF NOT EXISTS view_charts (
  id TEXT PRIMARY KEY,
  view_id TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- 'bar', 'line', 'pie', 'scatter', 'heatmap', etc.
  title TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON with complete configuration
  position INTEGER DEFAULT 0, -- Order in dashboard
  size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large', 'full'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
);

-- Add dashboard layout fields to views
ALTER TABLE views ADD COLUMN dashboard_layout TEXT; -- JSON with grid layout
ALTER TABLE views ADD COLUMN chart_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_charts_view_id ON view_charts(view_id);
CREATE INDEX IF NOT EXISTS idx_view_charts_position ON view_charts(view_id, position);

-- Update existing views to set chart_count to 0
UPDATE views SET chart_count = 0 WHERE chart_count IS NULL;

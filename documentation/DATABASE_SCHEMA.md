# Database Schema

## Overview
MagiXcel uses a database-agnostic architecture with **SQLite for development** and **Supabase (PostgreSQL 15+)** for production. All database operations go through an abstraction layer using the **Adapter Pattern** (`lib/adapters/db/`).

**Key Architecture Features:**
- Adapter Pattern: Single codebase supports both SQLite (dev) and Supabase (prod)
- Supabase Features: Row Level Security (RLS), JSONB with GIN indexes, real-time subscriptions
- DuckDB Integration: Analytics engine reads from Parquet files, metadata stored in Supabase
- Schema Compatibility: SQLite and PostgreSQL schemas are kept in sync via migrations

## Tables

### workspaces
Stores workspace information for organizing sessions (NotebookLM-style).

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder'
);

CREATE INDEX idx_workspaces_created_at ON workspaces(created_at DESC);
```

**Fields:**
- `id`: Unique workspace identifier (nanoid or 'default')
- `name`: Workspace name
- `description`: Optional workspace description
- `created_at`: Workspace creation timestamp
- `updated_at`: Last modification timestamp
- `color`: Hex color for visual identification (default: #3B82F6)
- `icon`: Icon identifier for workspace (default: 'folder')

---

### sessions
Stores metadata about uploaded files and user sessions.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv')),
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,

  -- R2 Storage Paths (DuckDB reads from these)
  r2_path_original TEXT NOT NULL,  -- /files/{sessionId}/original.xlsx
  r2_path_parquet TEXT NOT NULL,   -- /files/{sessionId}/data.parquet

  -- Data Metadata (JSONB)
  metadata JSONB NOT NULL,
  /* Example structure:
  {
    "sheets": [
      {
        "name": "Q1_Sales",
        "rowCount": 10000,
        "columnCount": 15,
        "columns": [
          {"name": "id", "type": "integer"},
          {"name": "date", "type": "date"},
          {"name": "amount", "type": "decimal"}
        ]
      }
    ],
    "totalRows": 10000,
    "parquetSize": 2500000,
    "compressionRatio": 0.42,
    "processingTime": 3421
  }
  */

  -- Active Filters (per-sheet, temporary filters in Explorer tab)
  active_filters JSONB,
  /* Example structure:
  {
    "Sheet1": {
      "filters": [
        {"column": "amount", "operator": "greaterThan", "value": 1000}
      ],
      "combinator": "AND",
      "appliedAt": "2025-01-15T10:30:00Z"
    }
  }
  */

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_sessions_hash ON sessions(file_hash);

-- GIN indexes for JSONB queries (Supabase only)
CREATE INDEX idx_sessions_metadata ON sessions USING GIN (metadata);
CREATE INDEX idx_sessions_filters ON sessions USING GIN (active_filters);
```

**Fields:**
- `id`: Unique session identifier (nanoid)
- `workspace_id`: Reference to parent workspace (foreign key)
- `user_id`: Reference to user who uploaded (Supabase auth.users)
- `name`: User-provided session name
- `original_file_name`: Original uploaded filename
- `file_type`: File format (xlsx, xls, csv)
- `file_size`: File size in bytes
- `file_hash`: SHA-256 hash for deduplication
- `r2_path_original`: Path to original file in R2/local storage
- `r2_path_parquet`: Path to Parquet file (DuckDB reads from this)
- `metadata`: JSONB with sheets, columns, row counts, and statistics
- `active_filters`: JSONB with per-sheet temporary filters (Explorer tab)
- `created_at`: Session creation timestamp
- `updated_at`: Last modification timestamp

---

### views
Stores persistent filter configurations (renamed from `filter_presets`). Views are global to workspace and can be applied to any sheet.

```sql
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',

  -- Filter Configuration (JSONB)
  filter_config JSONB NOT NULL,
  /* Example structure:
  {
    "filters": [
      {"column": "amount", "operator": "greaterThan", "value": 1000},
      {"column": "status", "operator": "equals", "value": "Active"}
    ],
    "combinator": "AND",
    "globalSearch": ""
  }
  */

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  public_link_id TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_views_workspace ON views(workspace_id);
CREATE INDEX idx_views_session ON views(session_id);
CREATE INDEX idx_views_user ON views(user_id);
CREATE INDEX idx_views_category ON views(category);
CREATE INDEX idx_views_public ON views(is_public) WHERE is_public = true;
CREATE UNIQUE INDEX idx_views_public_link ON views(public_link_id) WHERE public_link_id IS NOT NULL;

-- GIN index for filter queries
CREATE INDEX idx_views_filter_config ON views USING GIN (filter_config);
```

**Fields:**
- `id`: Unique view identifier
- `workspace_id`: Workspace this view belongs to (views are global to workspace)
- `session_id`: Session where view was created (for metadata)
- `user_id`: User who created the view
- `name`: View name
- `description`: Optional description
- `category`: View category (Custom, Sales, Finance, etc.)
- `filter_config`: JSONB with filter configuration
- `is_public`: Whether view is publicly shareable
- `public_link_id`: Unique ID for public sharing URL
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

---

### active_views
Tracks which views are currently active on each sheet. Multiple views can be active simultaneously (combined with AND logic).

```sql
CREATE TABLE active_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sheet_name TEXT,  -- NULL for CSV files
  view_id TEXT NOT NULL,
  user_id UUID NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  UNIQUE(session_id, sheet_name, view_id, user_id)
);

CREATE INDEX idx_active_views_session ON active_views(session_id, sheet_name);
CREATE INDEX idx_active_views_view ON active_views(view_id);
CREATE INDEX idx_active_views_user ON active_views(user_id);
```

**Fields:**
- `id`: Unique identifier
- `session_id`: Session where view is active
- `sheet_name`: Sheet name (NULL for CSV files)
- `view_id`: Reference to view being applied
- `user_id`: User who activated the view
- `created_at`: When view was activated

**Behavior:**
- Multiple views can be active on the same sheet (filters combined with AND)
- When user switches sheets, active views are persisted per sheet
- Deactivating a view removes it from active_views table

---

### view_charts
Stores chart configurations associated with views.

```sql
CREATE TABLE view_charts (
  id TEXT PRIMARY KEY,
  view_id TEXT NOT NULL,

  title TEXT NOT NULL,
  chart_type TEXT NOT NULL CHECK(chart_type IN ('bar', 'line', 'pie', 'doughnut', 'area', 'scatter')),

  -- Chart Configuration (JSONB)
  config JSONB NOT NULL,
  /* Example structure:
  {
    "xAxis": "region",
    "yAxis": "amount",
    "aggregation": "sum",
    "groupBy": "category",
    "colors": ["#3B82F6", "#10B981"],
    "showLegend": true,
    "showDataLabels": false
  }
  */

  size TEXT DEFAULT 'medium' CHECK(size IN ('small', 'medium', 'large')),
  position INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
);

CREATE INDEX idx_view_charts_view ON view_charts(view_id);
CREATE INDEX idx_view_charts_position ON view_charts(view_id, position);
```

**Fields:**
- `id`: Unique chart identifier
- `view_id`: View this chart belongs to
- `title`: Chart title
- `chart_type`: Type of chart (bar, line, pie, etc.)
- `config`: JSONB with chart-specific configuration
- `size`: Chart size on dashboard (small/medium/large)
- `position`: Display order in view (0 = first)
- `created_at`: Creation timestamp

---

## Relationships

```
workspaces (1) ──< (N) sessions
workspaces (1) ──< (N) views
sessions (1) ──< (N) active_views
views (1) ──< (N) active_views
views (1) ──< (N) view_charts
auth.users (1) ──< (N) workspaces, sessions, views, active_views
```

**Hierarchy:**
- A **workspace** contains multiple **sessions** (Excel/CSV files)
- A **workspace** contains multiple **views** (persistent filter configurations)
- Each **session** belongs to exactly one **workspace**
- Each **view** belongs to one **workspace** but can be applied to any session in that workspace
- **Active views** track which views are currently applied to which sheets
- When a **workspace** is deleted, all its sessions and views are cascade-deleted
- When a **view** is deleted, all its active_views and view_charts are cascade-deleted
- When a **session** is deleted, all its active_views are cascade-deleted

**File Storage:**
- Original files and Parquet files are stored in R2 (prod) or local filesystem (dev)
- Sessions table stores paths (`r2_path_original`, `r2_path_parquet`)
- DuckDB reads data directly from Parquet files using these paths
- No file binary data is stored in database

## Migration Strategy

### SQLite → Supabase
1. All SQL queries use parameterized statements (no raw SQL)
2. Database layer abstraction handles dialect differences
3. JSON columns used for complex data (compatible with both)
4. Migrations stored in `lib/db/migrations/`

### Migration Files
```
lib/db/migrations/
├── 001_initial_schema.sql
├── 002_add_workspaces.sql  -- Adds workspace support and default workspace
├── 003_add_caching.sql
└── 004_add_indexes.sql
```

**Migration 002_add_workspaces.sql:**
- Creates `workspaces` table
- Adds `workspace_id` column to `sessions` table
- Creates a 'default' workspace
- Assigns all existing sessions to the default workspace
- Adds `active_filters` column for per-sheet filter persistence

## Caching Strategy

**Development:** In-memory cache (JavaScript Map)
**Production:** Vercel KV (Redis)

Query results are cached using the **CacheAdapter** pattern:
- **Key**: `hash(sessionId + filterConfig)`
- **TTL**: 1 hour
- **Invalidation**: On session update/delete
- **Storage**: Vercel KV (Redis) in production, in-memory in development

**No database caching table** - the old `cached_results` table has been replaced by Vercel KV Redis for better performance and automatic expiration.

---

## Cleanup Jobs

- **Orphaned Files**: Delete R2/local files without valid session references
- **Old Sessions**: Archive sessions older than 30 days (configurable)
- **Inactive Active Views**: Clean up active_views for deleted sessions/views
- **Public Link Cleanup**: Remove expired public view links

## Backup Strategy
- SQLite: Daily file backups to `data/backups/`
- Supabase: Automatic Point-in-Time Recovery (PITR)
- Export to CSV for long-term archival

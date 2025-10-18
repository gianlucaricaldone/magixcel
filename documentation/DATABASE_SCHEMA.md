# Database Schema

## Overview
MagiXcel uses a database-agnostic architecture with SQLite for development and Supabase (PostgreSQL) for production. All database operations go through an abstraction layer in `lib/db/index.ts`.

## Tables

### sessions
Stores metadata about uploaded files and user sessions.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  original_file_name TEXT NOT NULL,
  original_file_hash TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  column_count INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv'))
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_file_hash ON sessions(original_file_hash);
```

**Fields:**
- `id`: Unique session identifier (nanoid)
- `name`: User-provided session name
- `created_at`: Session creation timestamp
- `updated_at`: Last modification timestamp
- `original_file_name`: Original uploaded filename
- `original_file_hash`: SHA-256 hash for deduplication
- `row_count`: Number of rows in the dataset
- `column_count`: Number of columns
- `file_size`: File size in bytes
- `file_type`: File format (xlsx, xls, csv)

---

### files
Stores the actual file data (or references to cloud storage).

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_type TEXT NOT NULL CHECK(storage_type IN ('local', 'cloud')),
  storage_path TEXT NOT NULL,
  file_data BLOB,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_session_id ON files(session_id);
```

**Fields:**
- `id`: Unique file identifier
- `session_id`: Reference to parent session
- `file_type`: MIME type
- `storage_type`: Where file is stored (local filesystem or cloud)
- `storage_path`: Path/key for file retrieval
- `file_data`: Binary file data (SQLite only, nullable for cloud storage)
- `uploaded_at`: Upload timestamp

---

### saved_filters
Stores user-created filter configurations for reuse.

```sql
CREATE TABLE saved_filters (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filter_config TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_filters_session_id ON saved_filters(session_id);
```

**Fields:**
- `id`: Unique filter identifier
- `session_id`: Reference to session
- `name`: User-provided filter name
- `description`: Optional description
- `filter_config`: JSON string with filter configuration
- `created_at`: Creation timestamp

**Filter Config Structure:**
```typescript
{
  "filters": [
    {
      "column": "Amount",
      "operator": "greaterThan",
      "value": 1000
    },
    {
      "column": "Status",
      "operator": "equals",
      "value": "Active"
    }
  ],
  "combinator": "AND" // or "OR"
}
```

---

### cached_results
Caches filtered results to avoid recomputation.

```sql
CREATE TABLE cached_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  filter_hash TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  result_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_cached_results_session_filter ON cached_results(session_id, filter_hash);
CREATE INDEX idx_cached_results_expires ON cached_results(expires_at);
```

**Fields:**
- `id`: Unique cache entry identifier
- `session_id`: Reference to session
- `filter_hash`: Hash of filter configuration
- `result_count`: Number of rows in result
- `result_data`: JSON string with result metadata or row IDs
- `created_at`: Cache creation timestamp
- `expires_at`: Cache expiration time (auto-cleanup)

---

## Relationships

```
sessions (1) ──< (N) files
sessions (1) ──< (N) saved_filters
sessions (1) ──< (N) cached_results
```

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
├── 002_add_caching.sql
└── 003_add_indexes.sql
```

## Cleanup Jobs
- **Expired Cache**: Delete `cached_results` where `expires_at < NOW()`
- **Orphaned Files**: Delete files without valid session references
- **Old Sessions**: Archive sessions older than 30 days (configurable)

## Backup Strategy
- SQLite: Daily file backups to `data/backups/`
- Supabase: Automatic Point-in-Time Recovery (PITR)
- Export to CSV for long-term archival

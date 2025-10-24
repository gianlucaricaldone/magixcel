# Database Migration Guide

## 🔄 Development Database Migration

### Quick Fix (Just Completed)

**Problem**: `no such column: user_id` error when creating workspace

**Solution**: Database recreated with updated schema

```bash
# Run the migration script
./scripts/migrate-dev-db.sh
```

**What it does:**
1. ✅ Backs up current database to `data/magixcel.db.backup-TIMESTAMP`
2. ✅ Deletes old database
3. ✅ Creates new database with updated schema from `lib/adapters/db/schema.sqlite.sql`
4. ✅ Creates default workspace with `user_id = 'dev-user'`

---

## 📊 Schema Changes (Old → New)

### Workspaces Table

**ADDED:**
- `user_id TEXT NOT NULL DEFAULT 'dev-user'` - Multi-tenancy support
- `is_default INTEGER NOT NULL DEFAULT 0` - Flag for default workspace

### Sessions Table

**CHANGED:**
- `original_file_hash` → `file_hash` (renamed)
- `row_count, column_count` → Moved to `metadata.totalRows, metadata.totalColumns`

**ADDED:**
- `user_id TEXT NOT NULL DEFAULT 'dev-user'`
- `r2_path_original TEXT NOT NULL` - Path to original file in storage
- `r2_path_parquet TEXT NOT NULL` - Path to Parquet file
- `metadata TEXT NOT NULL` - JSON metadata (sheets, rows, columns, etc.)
- `last_accessed_at TEXT` - Last access timestamp
- `deleted_at TEXT` - Soft delete support

**REMOVED:**
- `open_views_state` (deprecated, use `active_views` table instead)

### New Tables

**active_views** - Track which views are active on which sheets:
```sql
CREATE TABLE active_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sheet_name TEXT, -- NULL for CSV files
  view_id TEXT NOT NULL,
  created_at TEXT,
  UNIQUE(session_id, sheet_name, view_id)
);
```

---

## 🛠️ Manual Migration (If Needed)

If you need to preserve data during migration:

### 1. Export Data

```bash
# Export workspaces
sqlite3 data/magixcel.db <<EOF
.mode json
.output workspaces_backup.json
SELECT * FROM workspaces;
.quit
EOF

# Export sessions
sqlite3 data/magixcel.db <<EOF
.mode json
.output sessions_backup.json
SELECT * FROM sessions;
.quit
EOF
```

### 2. Run Migration

```bash
./scripts/migrate-dev-db.sh
```

### 3. Restore Data

Manually re-insert data using SQL or create a custom restore script.

---

## 🔧 Environment Variables

### Development (Current Setup)

```env
NODE_ENV=development
DB_PROVIDER=sqlite
SQLITE_DB_PATH=./data/magixcel.db
DEV_USER_ID=dev-user  # Default user ID for development
```

### Production (Future)

```env
NODE_ENV=production
DB_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
```

---

## 🚨 Common Issues

### Issue: "no such column: user_id"

**Cause**: Database using old schema
**Fix**: Run `./scripts/migrate-dev-db.sh`

### Issue: "no such column: r2_path_parquet"

**Cause**: Sessions table using old schema
**Fix**: Run `./scripts/migrate-dev-db.sh`

### Issue: "Cannot read property 'totalRows' of undefined"

**Cause**: Old sessions don't have `metadata` field
**Fix**:
1. Run migration script
2. Re-upload files (old sessions won't work with new code)

### Issue: "DEFAULT constraint failed: workspaces.user_id"

**Cause**: Trying to insert workspace without user_id
**Fix**: Code should use `getCurrentUserId()` from factory:
```typescript
import { getCurrentUserId } from '@/lib/adapters/db/factory';
const userId = getCurrentUserId(); // Returns 'dev-user' in development
await db.createWorkspace(userId, workspaceData);
```

---

## 📝 Migration Checklist

When updating schema:

- [ ] Update `lib/adapters/db/schema.sqlite.sql`
- [ ] Update `lib/adapters/db/interface.ts` (TypeScript types)
- [ ] Update `lib/adapters/db/sqlite.ts` (SQLite implementation)
- [ ] Update `lib/adapters/db/supabase.ts` (Supabase stub)
- [ ] Create migration script if needed
- [ ] Test with fresh database
- [ ] Test with existing data (if possible)
- [ ] Update documentation

---

## 🎯 Current Schema Version

**Version**: 2.0.0 (DuckDB Refactoring)
**Date**: 2025-01-24
**Schema File**: `lib/adapters/db/schema.sqlite.sql`

**Key Features:**
- ✅ Multi-tenancy support (user_id)
- ✅ DuckDB/Parquet integration (r2_path_parquet)
- ✅ Flexible metadata (JSONB)
- ✅ Active views tracking
- ✅ Soft delete support
- ✅ Default workspace system

---

## 🔄 Future Migrations

### From SQLite to Supabase

When moving to production:

1. Export data from SQLite
2. Transform data types:
   - `TEXT` → `UUID` (for IDs)
   - `INTEGER` (0/1) → `BOOLEAN`
   - `TEXT` (JSON) → `JSONB`
3. Import to Supabase
4. Enable Row Level Security (RLS)
5. Update connection string in environment variables

### Schema Updates

For future schema changes:
1. Create migration SQL file in `lib/adapters/db/migrations/` (if needed)
2. Document changes in this file
3. Update version number
4. Test migration on development first

---

## ✅ Verification

After migration, verify:

```bash
# Check schema
sqlite3 data/magixcel.db ".schema workspaces"
sqlite3 data/magixcel.db ".schema sessions"
sqlite3 data/magixcel.db ".schema active_views"

# Check default workspace exists
sqlite3 data/magixcel.db "SELECT * FROM workspaces WHERE is_default = 1;"

# Expected output:
# default|dev-user|Default Workspace|...|1|...
```

**All checks passed?** ✅ You're ready to use the new schema!

---

## 📚 Related Documentation

- [DUCKDB_INTEGRATION.md](./DUCKDB_INTEGRATION.md) - DuckDB integration details
- [CLEANUP_REPORT.md](./CLEANUP_REPORT.md) - Codebase cleanup report
- [README.md](./README.md) - Main documentation

---

**Last Updated**: 2025-01-24
**Migration Script**: `scripts/migrate-dev-db.sh`
**Schema File**: `lib/adapters/db/schema.sqlite.sql`

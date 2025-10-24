# MagiXcel Refactoring - Implementation Plan

## Architecture: Adapter Pattern for Dev/Prod

### Overview
```
┌─────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                   │
│            (API Routes, Components, Stores)          │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              ABSTRACTION LAYER (Adapters)            │
├──────────────────────────────────────────────────────┤
│  • DBAdapter:      get/create/update/delete          │
│  • StorageAdapter: upload/download/delete            │
│  • CacheAdapter:   get/set/delete                    │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│  DEVELOPMENT   │         │   PRODUCTION    │
├────────────────┤         ├─────────────────┤
│ • SQLite       │         │ • Supabase PG   │
│ • Local Files  │         │ • Cloudflare R2 │
│ • Memory Cache │         │ • Vercel KV     │
└────────────────┘         └─────────────────┘
```

---

## Environment-Based Configuration

### `.env.local` (Development)
```bash
NODE_ENV=development

# Database
DB_PROVIDER=sqlite
SQLITE_DB_PATH=./data/magixcel.db

# Storage
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./data/files

# Cache
CACHE_PROVIDER=memory

# DuckDB (works same in dev/prod)
DUCKDB_THREADS=4
DUCKDB_MEMORY_LIMIT=2GB
```

### `.env.production` (Production)
```bash
NODE_ENV=production

# Database
DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Storage
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=magixcel-files
R2_PUBLIC_URL=https://files.magixcel.com

# Cache
CACHE_PROVIDER=redis
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
```

---

## Implementation Steps

### Phase 1: Infrastructure Setup ✅
1. Install dependencies (duckdb, @supabase/ssr, @aws-sdk/client-s3)
2. Create adapter interfaces and implementations
3. Setup DuckDB client and query builder
4. Create Parquet converter utilities

### Phase 2: Database Migration 🔄
1. Create Supabase-compatible schema (SQL migrations)
2. Update SQLite schema to match Supabase structure
3. Update TypeScript types
4. Implement DBAdapter for both SQLite and Supabase

### Phase 3: API Refactoring 🔄
1. Refactor `/api/upload` to use DuckDB + Parquet + Storage adapter
2. Refactor `/api/filter` to use DuckDB query builder + Cache
3. Refactor `/api/session/*` to use DB adapter
4. Refactor `/api/workspaces/*` to use DB adapter

### Phase 4: Testing & Validation ✅
1. Test upload → Parquet → Query flow locally
2. Test filtering with caching
3. Test workspace/session CRUD
4. Performance benchmarks

### Phase 5: Production Setup (Future)
1. Setup Supabase project
2. Setup Cloudflare R2 bucket
3. Setup Vercel KV
4. Deploy and test production environment

---

## Key Design Decisions

### 1. Adapter Pattern
**Why**: Single codebase, zero code duplication, easy testing

```typescript
// Application code stays the same:
const db = getDBAdapter(); // Returns SQLite or Supabase based on env
const session = await db.getSession(sessionId);

// No if/else in application code!
```

### 2. Parquet as Universal Format
**Why**:
- DuckDB reads Parquet 50x faster than CSV
- Works same way locally and from R2
- 60-70% smaller file size

### 3. DuckDB for All Queries
**Why**:
- Works same in dev/prod
- Handles files up to 1GB easily
- Sub-100ms query times
- No code changes needed between environments

### 4. Schema Compatibility
**Why**:
- SQLite schema designed to be compatible with Supabase
- Same column names, types, constraints
- Migration script converts data 1:1

---

## File Structure Changes

```
lib/
├── adapters/
│   ├── db/
│   │   ├── interface.ts           # IDBAdapter interface
│   │   ├── sqlite.ts              # SQLite implementation
│   │   ├── supabase.ts            # Supabase implementation
│   │   └── factory.ts             # getDBAdapter() - env-based
│   │
│   ├── storage/
│   │   ├── interface.ts           # IStorageAdapter interface
│   │   ├── local.ts               # Local file system
│   │   ├── r2.ts                  # Cloudflare R2
│   │   └── factory.ts             # getStorageAdapter()
│   │
│   └── cache/
│       ├── interface.ts           # ICacheAdapter interface
│       ├── memory.ts              # In-memory cache
│       ├── redis.ts               # Vercel KV (Redis)
│       └── factory.ts             # getCacheAdapter()
│
├── duckdb/
│   ├── client.ts                  # DuckDB connection manager
│   ├── query-builder.ts           # FilterConfig → SQL
│   ├── executor.ts                # Query execution + streaming
│   └── types.ts
│
├── processing/
│   ├── excel-reader.ts            # Read Excel with DuckDB
│   ├── csv-reader.ts              # Read CSV with DuckDB
│   ├── parquet-converter.ts       # Convert to Parquet
│   ├── metadata-extractor.ts     # Extract schema, stats
│   └── type-inference.ts          # Infer column types
│
└── utils/
    ├── env.ts                     # Environment helpers
    ├── paths.ts                   # Path resolution (dev/prod)
    └── config.ts                  # App configuration
```

---

## Migration Strategy

### For Existing Users (Development → Production)

```typescript
// 1. Export data from SQLite
npm run migrate:export

// 2. Setup Supabase project
npm run migrate:setup-supabase

// 3. Import data to Supabase
npm run migrate:import

// 4. Verify data integrity
npm run migrate:verify

// 5. Switch environment variables
cp .env.production .env.local

// 6. Restart application
npm run build && npm start
```

### Data Compatibility

All data structures are 100% compatible:
- ✅ Workspaces: Same schema
- ✅ Sessions: Same schema + R2 paths added
- ✅ Filter Presets: Same schema
- ✅ Files: Converted to Parquet (readable by DuckDB in both envs)

---

## Testing Strategy

### Unit Tests
- Each adapter implementation tested independently
- Mock implementations for testing
- Query builder validation

### Integration Tests
- Full upload → query → export flow
- Cross-file joins
- Cache invalidation

### Performance Tests
- 100MB file upload
- 1M row filtering
- Query response times (<100ms target)

---

## Success Metrics

### Development Environment
- ✅ Upload 100MB Excel file in < 10 seconds
- ✅ Filter 500k rows in < 200ms
- ✅ Zero Supabase/R2 dependencies
- ✅ Works completely offline

### Production Environment
- ✅ Upload 1GB Excel file in < 30 seconds
- ✅ Filter 1M rows in < 100ms
- ✅ Cached queries return in < 10ms
- ✅ Scales to multiple concurrent users

---

## Next Steps

1. ✅ Install npm dependencies
2. 🔄 Create adapter interfaces
3. 🔄 Implement SQLite adapter (refactor existing code)
4. 🔄 Implement local storage adapter
5. 🔄 Implement DuckDB client
6. 🔄 Test complete flow in development
7. ⏸️ Implement Supabase adapter (when needed)
8. ⏸️ Implement R2 adapter (when needed)
9. ⏸️ Production deployment

**Current Focus**: Steps 1-6 (Development environment only)

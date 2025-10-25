# MagiXcel - Claude AI Development Guide

> **Purpose:** This file contains essential information for Claude AI to maintain context and consistency across development sessions for the MagiXcel project.

---

## 📋 Project Overview

**MagiXcel** is an Excel/CSV data exploration and analysis platform with advanced filtering, visualization, and workspace management capabilities.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Database**: SQLite (dev), Supabase PostgreSQL 15+ (prod) - **Adapter Pattern**
- **Analytics Engine**: **DuckDB 0.9.x** (columnar analytics, sub-100ms queries)
- **File Format**: **Parquet** (60-70% compression, columnar storage)
- **Charts**: Recharts 2.x
- **File Processing**: DuckDB native readers (Excel/CSV → Parquet)
- **Storage**: Local FS (dev), Cloudflare R2 (prod) - **Adapter Pattern**
- **Cache**: In-memory (dev), Vercel KV Redis (prod) - **Adapter Pattern**

---

## 🎯 Core Architecture

### Data Hierarchy
```
Workspace (isolamento views)
  └── Session (1:1 con file Excel/CSV)
       ├── Parquet file (DuckDB analytics)
       └── Sheet (foglio Excel, null per CSV)
            └── Active Views (N views attive per sheet)
```

### Key Concepts

1. **Workspaces**: Organizzazione top-level (stile NotebookLM)
2. **Sessions**: Rappresentano un file caricato (Excel/CSV)
3. **Views**: Configurazioni di filtri salvate e riutilizzabili
   - Globali al workspace (non legate a fogli specifici)
   - Possono essere applicate a N fogli
   - Multiple views attive → filtri in AND logic
4. **Active Views**: Tabella di associazione (session, sheet, view)
   - Persiste quali views sono attive per ogni foglio
5. **Explorer vs Views Tab**:
   - **Explorer**: Filtri temporanei (salvati in `sessions.active_filters`)
   - **Views**: Filtri persistenti e riutilizzabili (salvati in `views` table)

---

## 📚 Essential Documentation

### Development Standards
**⭐ [documentation/CODING_STANDARDS.md](./documentation/CODING_STANDARDS.md)** - **READ THIS FIRST**

Contiene linee guida fondamentali su:
- Naming conventions (camelCase vs snake_case)
- API design patterns
- Database schema rules
- React component structure
- Error handling
- File organization

**Architecture Documents:**
- **[documentation/ARCHITECTURE.md](./documentation/ARCHITECTURE.md)** - Adapter Pattern, DuckDB pipeline
- **[documentation/DATABASE_SCHEMA.md](./documentation/DATABASE_SCHEMA.md)** - Complete Supabase schema
- **[documentation/API_ENDPOINTS.md](./documentation/API_ENDPOINTS.md)** - All API routes with DuckDB flow
- **[documentation/DUCKDB_INTEGRATION.md](./documentation/DUCKDB_INTEGRATION.md)** - DuckDB refactoring details

**CRITICAL RULE**:
- API requests/responses → **camelCase** (`filterConfig`, `isPublic`)
- Database columns → **snake_case** (`filter_config`, `is_public`)
- Conversione avviene nell'API layer

**KEY ARCHITECTURE**:
- **Adapter Pattern**: lib/adapters/ (db, storage, cache) auto-select dev/prod
- **DuckDB Pipeline**: Upload → Parquet → Query (sub-100ms)
- **Parquet Format**: 60-70% compression vs JSON, columnar storage

---

## 📝 Documentation Maintenance

**IMPORTANT**: When implementing significant features or architectural changes, **ALWAYS update the relevant documentation files**:

### Documentation Files to Update

1. **[documentation/ARCHITECTURE.md](./documentation/ARCHITECTURE.md)**
   - Update when: Adding new adapters, changing data flow, adding major architectural patterns
   - Examples: New storage adapter, DuckDB integration changes, state management updates

2. **[documentation/DATABASE_SCHEMA.md](./documentation/DATABASE_SCHEMA.md)**
   - Update when: Adding/modifying tables, adding indexes, changing JSONB structures
   - Examples: New table, new columns, foreign key changes, migrations

3. **[documentation/API_ENDPOINTS.md](./documentation/API_ENDPOINTS.md)**
   - Update when: Adding/modifying API routes, changing request/response formats
   - Examples: New endpoint, changed parameters, new error codes

4. **[documentation/UI_COMPONENTS.md](./documentation/UI_COMPONENTS.md)**
   - Update when: Adding new UI components, changing layout structure, new patterns
   - Examples: New panel, layout refactor, new common pattern, component prop changes

5. **[documentation/CODING_STANDARDS.md](./documentation/CODING_STANDARDS.md)**
   - Update when: Establishing new coding conventions, patterns, or best practices
   - Examples: New naming convention, React pattern, error handling standard

6. **[documentation/LIVE_FILTERING.md](./documentation/LIVE_FILTERING.md)**
   - Update when: Changing filter implementation, filter state management
   - Examples: New filter operators, filter persistence changes

7. **[documentation/CHANGELOG.md](./documentation/CHANGELOG.md)**
   - Update when: Completing any user-facing feature or bug fix
   - Examples: New feature shipped, breaking change, bug fix

8. **[documentation/FEATURE_ROADMAP.md](./documentation/FEATURE_ROADMAP.md)**
   - Update when: Planning new features or marking features as completed
   - Examples: Feature planned, feature completed (move to CHANGELOG)

9. **[documentation/DEPLOYMENT_GUIDE.md](./documentation/DEPLOYMENT_GUIDE.md)**
   - Update when: Changing deployment process, environment variables, infrastructure
   - Examples: New env var, deployment step, production service

10. **[documentation/README.md](./documentation/README.md)**
    - Update when: Adding new documentation file or reorganizing structure
    - Update "Recent Updates" section with date and summary

### When to Update Documentation

**Update IMMEDIATELY when:**
- ✅ Adding new database tables/columns
- ✅ Adding new API endpoints
- ✅ Creating new UI components or layouts
- ✅ Changing architectural patterns
- ✅ Implementing major features
- ✅ Making breaking changes

**Guidelines:**
- Update documentation **in the same commit** as code changes
- Keep examples **accurate and tested**
- Remove **obsolete information**
- Add **cross-references** to related docs
- Update **"Last Updated"** date in relevant files

### Documentation Consolidation

The documentation has been consolidated from 24+ files to **10 essential files**:
- All duplicates removed
- Content organized by topic
- Cross-referenced for easy navigation
- Index provided in `documentation/README.md`

**DO NOT create new documentation files** unless absolutely necessary. Instead, add content to existing files in the appropriate section.

---

## 🗂️ Project Structure

```
/app/
  /api/                    # API routes (Next.js route handlers)
  /app/                    # Frontend pages (Next.js app router)
    /workspace/[id]/
      /session/[id]/
        page.tsx           # Main session view

/components/
  /ui/                     # shadcn/ui components
  /dashboard/              # Dashboard-specific components
  /views/                  # Views feature components
  /filters/                # Filter builder components
  /charts/                 # Chart components

/lib/
  /adapters/               # Adapter Pattern (dev/prod)
    /db/                   # Database adapters
      sqlite.ts            # SQLite (dev)
      supabase.ts          # Supabase (prod)
      index.ts             # Auto-select
    /storage/              # File storage adapters
      local.ts             # Local FS (dev)
      r2.ts                # Cloudflare R2 (prod)
      index.ts             # Auto-select
    /cache/                # Cache adapters
      memory.ts            # In-memory (dev)
      vercel-kv.ts         # Vercel KV (prod)
      index.ts             # Auto-select
  /duckdb/                 # DuckDB analytics engine
    client.ts              # Connection manager
    query-builder.ts       # FilterConfig → SQL
    executor.ts            # Query execution
  /processing/             # Business logic
    parquet-converter.ts   # Excel/CSV → Parquet
    filter-engine.ts       # Filter application logic

/stores/                   # Zustand state management
  filter-store.ts          # Filters & views state
  data-store.ts            # Data & sheets state

/types/                    # TypeScript type definitions
  database.ts              # Database models (IView, ISession, etc.)
```

---

## 🗄️ Database Schema (SQLite)

### Key Tables

```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions (files)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,

  -- R2 Storage Paths (DuckDB reads from these)
  r2_path_original TEXT NOT NULL,  -- /files/{sessionId}/original.xlsx
  r2_path_parquet TEXT NOT NULL,   -- /files/{sessionId}/data.parquet

  -- Metadata (JSONB - sheets, columns, stats)
  metadata JSONB NOT NULL,

  -- Active Filters (per-sheet, temporary filters from Explorer tab)
  active_filters JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Views (persistent filters)
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,  -- Views are global to workspace
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  filter_config JSONB NOT NULL,  -- Persistent filter configuration
  is_public BOOLEAN DEFAULT false,
  public_link_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Active Views (which views are active on which sheets)
CREATE TABLE active_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sheet_name TEXT,              -- NULL for CSV files
  view_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE,
  UNIQUE(session_id, sheet_name, view_id)
);

-- View Charts
CREATE TABLE view_charts (
  id TEXT PRIMARY KEY,
  view_id TEXT NOT NULL,
  title TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  config TEXT NOT NULL,  -- JSON: chart configuration
  size TEXT DEFAULT 'medium',
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
);
```

---

## 🔄 Common Workflows

### 1. Loading a Session

```typescript
// 1. Fetch session metadata
GET /api/session/{sessionId}

// 2. Fetch session data
GET /api/session/{sessionId}/data

// 3. Load views for workspace
GET /api/views?workspaceId=xxx&sessionId=xxx

// 4. Load active views for sheet
GET /api/active-views?sessionId=xxx&sheetName=xxx

// 5. Apply filters
// - Explorer filters: from sessions.active_filters
// - Active view filters: from views.filter_config (AND logic)
```

### 2. Saving a View

```typescript
// From Explorer tab → Save as View
POST /api/views
Body: {
  name: string,
  description: string,
  category: string,
  filterConfig: IFilterConfig,  // Current filter state
  workspaceId: string,
  sessionId: string
}
```

### 3. Activating a View

```typescript
// User checks view in sidebar
POST /api/active-views
Body: {
  sessionId: string,
  sheetName: string | null,
  viewId: string
}

// Deactivate view
DELETE /api/active-views?sessionId=xxx&sheetName=xxx&viewId=xxx
```

### 4. DuckDB Query Flow (Filtering)

```typescript
// User applies filter in FilterBuilder UI
User modifies filter
  ↓
FilterConfig → SQL query (via lib/duckdb/query-builder.ts)
  ↓
Check CacheAdapter: hash(sessionId + filterConfig)
  ↓ HIT: Return cached results (<10ms)
  ↓ MISS: Execute DuckDB query
  ↓
Get session.r2_path_parquet from DBAdapter
  ↓
DuckDB queries Parquet file:
  SELECT * FROM read_parquet('https://r2.../data.parquet')
  WHERE sheet_name = 'Q1_Sales'
    AND amount > 1000
    AND region IN ('EU', 'US')
  LIMIT 100 OFFSET 0;
  ↓
DuckDB returns filtered rows (50-200ms)
  ↓
Cache result (CacheAdapter, 1h TTL)
  ↓
Return to frontend
```

**Performance:**
- **Cached**: <10ms
- **Uncached**: 50-200ms (even on 1M rows)
- **Parquet benefits**: 60-70% compression, columnar reads, predicate pushdown

---

## 🎨 UI/UX Patterns

### Tab Structure

```
┌─────────────────────────────────────┐
│ Explorer | Views | AI Insights      │
├─────────────────────────────────────┤
│                                     │
│  [Content based on active tab]     │
│                                     │
└─────────────────────────────────────┘
```

**Explorer Tab**:
- Filtri temporanei live
- DataTable con filtri applicati
- Pulsante "Save as View" per rendere filtri persistenti

**Views Tab**:
```
┌──────────┬───────────────────────────┐
│ Sidebar  │ Main Panel               │
│          │ ┌─────────────────────┐  │
│ □ View 1 │ │ Sub-tabs:           │  │
│ ☑ View 2 │ │ Data | Charts       │  │
│ □ View 3 │ ├─────────────────────┤  │
│          │ │                     │  │
│ + New    │ │ [Content]           │  │
└──────────┴─┴─────────────────────┴──┘
```

- Checkbox: Attiva/disattiva filtri view
- Click nome: Apre drawer editing (slide da destra)
- Main panel: Sempre visibile con dati filtrati da views attive (AND)
- Charts tab: UNION di tutti i charts dalle views attive

---

## 🚨 Common Pitfalls & Solutions

### 1. API Naming Mismatch
**Problem**: API ignora campi perché nome errato (snake_case vs camelCase)

```typescript
// ❌ WRONG - Field ignored by API
fetch('/api/views/123', {
  body: JSON.stringify({ filter_config: {...} })
});

// ✅ CORRECT
fetch('/api/views/123', {
  body: JSON.stringify({ filterConfig: {...} })  // camelCase!
});
```

**Solution**: Always use camelCase in API requests, conversion to snake_case happens in API route.

### 2. React Component Not Re-rendering After Data Update

**Problem**: Component shows stale data even after reload

**Solution**: Use proper React keys that change when data changes

```typescript
// ❌ Static key - component won't remount
<EditDrawer key={viewId} view={view} />

// ✅ Dynamic key - remounts when view updates
<EditDrawer
  key={`${view.id}-${view.updated_at}`}
  view={view}
/>
```

### 3. Infinite Loop in useEffect

**Problem**: useEffect triggers itself infinitely

**Common cause**: Object/array in dependencies without proper memoization

```typescript
// ❌ Creates new object every render
useEffect(() => {
  applyFilters(data, { filters, combinator });
}, [data, { filters, combinator }]);  // New object ref each time!

// ✅ Proper dependencies
useEffect(() => {
  const config = getFilterConfig();  // Memoized getter
  applyFilters(data, config);
}, [data, filters, combinator]);  // Primitive dependencies
```

---

## 🔍 Debugging Tips

### Check Database State
```bash
sqlite3 data/magixcel.db "SELECT * FROM views WHERE id = 'xxx';"
sqlite3 data/magixcel.db "SELECT * FROM active_views WHERE session_id = 'xxx';"
```

### Check API Responses
- Always log API responses during development
- Use browser DevTools Network tab
- Check console for errors

### State Debugging
```typescript
// Add to component for debugging
console.log('Current state:', {
  views: useFilterStore.getState().views,
  activeFilters: useFilterStore.getState().filtersBySheet,
  currentData: useDataStore.getState().filteredData
});
```

---

## 📝 TODO: Future Improvements

- [ ] Implementare Command Palette (⌘K) funzionale
- [ ] Export to PowerPoint/PDF dalle views
- [ ] AI Insights tab (placeholder implementato)
- [ ] View templates (Save as Template)
- [ ] Duplicate view functionality
- [ ] Share view publicly (public_link_id già in schema)
- [ ] Chart editing inline nelle views
- [ ] Filtri avanzati: date range, regex, custom operators
- [ ] Performance: virtualized table per dataset molto grandi
- [ ] Multi-language support

---

## 🤝 Development Workflow

1. **Leggi CODING_STANDARDS.md** prima di scrivere codice
2. **Controlla schema DB** prima di modificare API
3. **Usa TypeScript strict mode** - no any
4. **Test manuali** dopo ogni feature:
   - Reload pagina
   - Switch tabs
   - Multi-sheet files
   - Empty states
5. **Commit messages** descrittivi (usare template esistente)

---

**Last Updated**: 2025-10-25
**Claude AI Context**: This file helps maintain consistency across sessions

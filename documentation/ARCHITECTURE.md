# Architecture

## Design Principles

### 1. Database Agnostic
All database operations go through an abstraction layer (`lib/db/index.ts`) that provides a unified interface. This allows seamless migration from SQLite to Supabase.

```typescript
// Good ✓
import { db } from '@/lib/db';
const session = await db.getSession(id);

// Bad ✗
import Database from 'better-sqlite3';
const db = new Database('magixcel.db');
```

### 2. Separation of Concerns
- **Components**: UI only, no business logic
- **Lib**: Business logic, data processing
- **Stores**: Global state management
- **API Routes**: HTTP handlers, validation, orchestration

### 3. Type Safety
- TypeScript strict mode enabled
- Zod for runtime validation
- Shared types in `types/` directory

### 4. Performance First
- Virtual scrolling for large datasets
- Lazy loading and code splitting
- Caching layer for expensive operations
- Future WASM for heavy processing

---

## Directory Structure

```
app/                                # Next.js App Router
├── layout.tsx                     # Root layout (providers, fonts)
├── page.tsx                       # Landing page
├── app/                           # Application routes
│   ├── page.tsx                   # Workspace grid
│   ├── workspace/                 # Workspace routes
│   │   └── [workspaceId]/
│   │       ├── page.tsx           # Workspace detail (sessions)
│   │       └── session/
│   │           └── [sessionId]/
│   │               └── page.tsx   # Session viewer (data table)
└── api/                           # API endpoints
    ├── workspace/                 # Workspace CRUD
    │   ├── route.ts              # GET, POST workspaces
    │   └── [id]/
    │       ├── route.ts          # GET, PUT, DELETE workspace
    │       └── sessions/
    │           └── route.ts      # GET sessions by workspace
    ├── upload/                    # File upload
    ├── filter/                    # Filter operations
    ├── export/                    # Export operations
    └── session/                   # Session management

components/                        # React components
├── ui/                           # shadcn/ui + Radix UI primitives
├── workspace/                    # Workspace components
│   ├── WorkspaceGrid.tsx        # Grid of workspace cards
│   ├── CreateWorkspaceModal.tsx # Create workspace modal
│   └── EditWorkspaceModal.tsx   # Edit workspace modal
├── upload/                       # File upload components
├── session/                      # Session viewer components
│   ├── DataTable.tsx            # Main data table
│   └── SheetTabs.tsx            # Sheet navigation
├── table/                        # Data table components
├── filters/                      # Filter UI
└── export/                       # Export dialogs

lib/                              # Core business logic
├── db/                           # Database abstraction
│   ├── index.ts                 # DB interface + exports
│   ├── sqlite.ts                # SQLite implementation
│   ├── supabase.ts              # Supabase implementation
│   ├── schema.sql               # Database schema
│   └── migrations/              # Database migrations
│       └── 002_add_workspaces.sql
├── processing/                   # File processing
├── storage/                      # File storage
├── utils/                        # Utilities
└── hooks/                        # Custom hooks

stores/                           # Zustand state stores
├── session-store.ts             # Session state
├── filter-store.ts              # Filter state (per-sheet)
├── data-store.ts                # Data state (multi-sheet)
└── ui-store.ts                  # UI state

types/                            # TypeScript types
├── database.ts                  # DB types (IWorkspace, ISession)
└── filters.ts                   # Filter types
```

---

## Data Flow

### Application Hierarchy
```
Workspace
  └─ Sessions (Excel/CSV files)
       └─ Sheets (for multi-sheet Excel)
            └─ Data + Filters
```

### Route Navigation Flow
```
/app (Workspace Grid)
    ↓
User clicks workspace or creates new
    ↓
/app/workspace/[workspaceId]
    ↓
User uploads file or clicks existing session
    ↓
/app/workspace/[workspaceId]/session/[sessionId]
    ↓
User views data, applies filters, switches sheets
```

### File Upload Flow
```
User uploads file (from workspace page)
    ↓
FileUploader component (with workspaceId prop)
    ↓
POST /api/upload (includes workspaceId)
    ↓
excel-processor.ts / csv-processor.ts
    ↓ (if Excel, extract all sheets)
Multi-sheet data structure created
    ↓
Database (session + file with workspace_id)
    ↓
Storage (local/cloud)
    ↓
Return sessionId + metadata + sheets
    ↓
Navigate to /app/workspace/{workspaceId}/session/{sessionId}
```

### Filter Application Flow (Multi-Sheet)
```
User creates/edits filter on Sheet1
    ↓
FilterBuilder component
    ↓
filter-store.setFilters('Sheet1', filters) (Zustand)
    ↓ (Live filtering - auto apply)
Filter engine applies filters to Sheet1 data
    ↓
Update filteredRows count for Sheet1
    ↓
PUT /api/session/:id (persist active_filters)
    ↓
Database saves filtersBySheet to active_filters JSON
    ↓
DataTable re-renders with filtered data
    ↓
User switches to Sheet2
    ↓
Sheet1 filters remain in memory
    ↓
Load Sheet2 data + apply Sheet2 filters (if any)
    ↓
Independent filter state maintained
```

### Workspace Management Flow
```
User creates workspace
    ↓
CreateWorkspaceModal (name, description, color)
    ↓
POST /api/workspace
    ↓
Database creates workspace record
    ↓
Navigate to /app/workspace/{newWorkspaceId}
    ↓
User can now upload files to this workspace
```

### Export Flow (Multi-Sheet)
```
User clicks Export
    ↓
Export dialog (choose format: xlsx, csv, json)
    ↓
POST /api/export
    ↓
Backend retrieves all sheets' data
    ↓
Apply each sheet's filters from filtersBySheet
    ↓
For XLSX: Create workbook with multiple sheets (all filtered)
For CSV: Export only active sheet (filtered)
For JSON: Export all sheets as structured data (filtered)
    ↓
Stream file to user
```

---

## Database Layer

### SQLite Implementation (`lib/db/sqlite.ts`)
```typescript
import Database from 'better-sqlite3';

export class SQLiteDB implements IDatabase {
  private db: Database.Database;

  async getSession(id: string) {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id);
  }
}
```

### Supabase Implementation (`lib/db/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export class SupabaseDB implements IDatabase {
  private client: SupabaseClient;

  async getSession(id: string) {
    const { data } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
```

### Abstraction Layer (`lib/db/index.ts`)
```typescript
export interface IDatabase {
  // Workspace methods
  getWorkspace(id: string): Promise<IWorkspace | null>;
  createWorkspace(data: WorkspaceData): Promise<IWorkspace>;
  updateWorkspace(id: string, data: Partial<WorkspaceData>): Promise<IWorkspace>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(limit?: number, offset?: number): Promise<IWorkspace[]>;

  // Session methods
  getSession(id: string): Promise<ISession | null>;
  createSession(data: SessionData): Promise<ISession>;
  listSessionsByWorkspace(workspaceId: string, limit?: number, offset?: number): Promise<ISession[]>;
  updateSession(id: string, data: Partial<SessionData>): Promise<ISession>;
  deleteSession(id: string): Promise<void>;

  // ... other methods (files, filters, cache)
}

export const db: IDatabase =
  process.env.DATABASE_TYPE === 'supabase'
    ? new SupabaseDB()
    : new SQLiteDB();
```

### Session Data with Multi-Sheet Support
```typescript
interface ISession {
  id: string;
  workspace_id: string;  // Foreign key to workspace
  name: string;
  created_at: string;
  updated_at: string;
  original_file_name: string;
  original_file_hash: string;
  row_count: number;
  column_count: number;
  file_size: number;
  file_type: 'xlsx' | 'xls' | 'csv';
  active_filters: string | null;  // JSON: { [sheetName]: { filters, combinator } }
}

// active_filters structure
type ActiveFilters = {
  [sheetName: string]: {
    filters: Filter[];
    combinator: 'AND' | 'OR';
    appliedAt: string;
  };
};
```

---

## State Management

### Zustand Stores

#### session-store.ts
```typescript
interface SessionState {
  sessionId: string | null;
  workspaceId: string | null;
  metadata: SessionMetadata | null;
  setSession: (id: string, workspaceId: string, metadata: SessionMetadata) => void;
  clearSession: () => void;
}
```

#### filter-store.ts (Multi-Sheet Support)
```typescript
interface SheetFilters {
  filters: Filter[];
  combinator: 'AND' | 'OR';
  appliedAt?: string;
}

interface FilterState {
  // Per-sheet filter storage
  filtersBySheet: Record<string, SheetFilters>;
  currentSheet: string;

  // Actions
  setSheet: (sheetName: string) => void;
  setFilters: (sheetName: string, filters: Filter[]) => void;
  getFilters: (sheetName: string) => Filter[];
  setCombinator: (sheetName: string, combinator: 'AND' | 'OR') => void;
  clearSheet: (sheetName: string) => void;
  clearAllSheets: () => void;

  // Global operations
  loadFiltersFromSession: (activeFilters: ActiveFilters) => void;
  exportFilters: () => ActiveFilters;
}
```

**Key Changes:**
- `filtersBySheet` replaces single `filters` array
- Each sheet has independent filter state
- `currentSheet` tracks which sheet is active
- Filters persist when switching sheets

#### data-store.ts (Multi-Sheet Support)
```typescript
interface SheetData {
  columns: string[];
  data: any[][];
  totalRows: number;
  filteredRows: number;
}

interface DataState {
  // Multi-sheet data storage
  allSheets: Record<string, SheetData>;
  currentSheet: string;
  sheetNames: string[];

  // Actions
  loadSheet: (sheetName: string, data: SheetData) => void;
  switchSheet: (sheetName: string) => void;
  getCurrentSheetData: () => SheetData | null;
  updateFilteredCount: (sheetName: string, count: number) => void;
  clearAllData: () => void;
}
```

**Key Changes:**
- `allSheets` stores data for each sheet separately
- `sheetNames` array for tab navigation
- Independent row counts per sheet

#### ui-store.ts
```typescript
interface UIState {
  // Sheet navigation
  activeSheet: string;
  setActiveSheet: (sheetName: string) => void;

  // Loading states
  isLoadingSheet: boolean;
  setLoadingSheet: (loading: boolean) => void;

  // Modal states
  showCreateWorkspace: boolean;
  showEditWorkspace: boolean;
  // ... other UI state
}
```

---

## Processing Pipeline

### Excel Processing
```
File upload
    ↓
XLSX.read() - Parse Excel
    ↓
Extract sheets
    ↓
Convert to JSON
    ↓
Type inference
    ↓
Store in DB
```

### CSV Processing
```
File upload
    ↓
PapaParse.parse()
    ↓
Header detection
    ↓
Type inference
    ↓
Convert to JSON
    ↓
Store in DB
```

### Future: WASM Processing
For extremely large files (>100MB), processing will be offloaded to WASM modules:
- Faster parsing
- No Node.js memory limits
- Parallel processing

---

## Caching Strategy

### Filter Results Cache
- Key: `hash(sessionId + filterConfig)`
- TTL: 1 hour
- Invalidation: On session update/delete

### File Storage Cache
- Local: `data/uploads/{sessionId}/{fileId}`
- Cloud: R2/S3 bucket with CDN

---

## Security Considerations

### File Upload
- Validate file type (magic bytes, not just extension)
- Limit file size (1GB max)
- Sanitize file names
- Scan for malicious content

### Session Isolation
- Session-based access control
- No cross-session data access
- Automatic session cleanup

### SQL Injection Prevention
- Parameterized queries only
- No string concatenation in SQL
- ORM-style abstractions

---

## Performance Optimizations

### Frontend
- Virtual scrolling (TanStack Table)
- Lazy loading components
- Code splitting per route
- Memoization of expensive components

### Backend
- Result caching
- Pagination for large datasets
- Streaming responses for exports
- Background job processing

### Database
- Indexes on frequently queried columns
- Connection pooling
- Query optimization

---

## Deployment Architecture

### Development
```
Local Machine
├── Next.js Dev Server (localhost:3000)
├── SQLite Database (data/magixcel.db)
└── Local File Storage (data/uploads)
```

### Production (Future)
```
Vercel/Cloudflare Pages
├── Next.js Application
├── Supabase (PostgreSQL)
├── Cloudflare R2 (File Storage)
└── Cloudflare Workers (Background Jobs)
```

---

## Testing Strategy

### Unit Tests
- Utilities and helpers
- Data processing functions
- Filter engine logic

### Integration Tests
- API endpoints
- Database operations
- File processing pipeline

### E2E Tests
- Complete user flows
- Upload → Filter → Export
- Error handling scenarios

---

## Workspace Architecture

### Hierarchy Model
MagiXcel implements a 3-level hierarchy inspired by NotebookLM:

```
Level 1: Workspaces
  └─ Level 2: Sessions (Excel/CSV files)
       └─ Level 3: Sheets (for multi-sheet Excel)
```

### Workspace Features

#### Visual Organization
- **Color Coding**: 8 predefined colors for quick identification
- **Icons**: Currently 'folder', extensible for future icon sets
- **Descriptions**: Optional metadata for workspace purpose
- **Grid View**: Card-based layout for workspace overview

#### Default Workspace
- Always exists (ID: 'default')
- Cannot be deleted (UI prevents)
- Can be edited (name, description, color)
- Fallback for sessions without explicit workspace

#### Cascade Deletion
- Deleting a workspace deletes all its sessions
- Confirmation dialog protects against accidental deletion
- Session deletion does not affect workspace

### Route Structure

```
/app
  ├─ Workspace Grid (all workspaces)
  │
  ├─ /app/workspace/[workspaceId]
  │   ├─ Workspace detail page
  │   ├─ Upload tab (FileUploader with workspaceId)
  │   └─ Sessions tab (SessionList filtered by workspace)
  │
  └─ /app/workspace/[workspaceId]/session/[sessionId]
      └─ Session viewer (data table, filters, sheet tabs)
```

### Multi-Sheet Excel Architecture

#### Sheet Independence
Each sheet in an Excel file maintains:
- Independent data structure (columns, rows)
- Independent filter state (filters, combinator)
- Independent row counts (total, filtered)
- Independent scroll position

#### Filter Persistence
```typescript
// Database: sessions.active_filters (JSON column)
{
  "Sheet1": {
    "filters": [{ column: "Amount", operator: "greaterThan", value: 1000 }],
    "combinator": "AND",
    "appliedAt": "2025-10-19T10:30:00Z"
  },
  "Sheet2": {
    "filters": [{ column: "Status", operator: "equals", value: "Active" }],
    "combinator": "OR",
    "appliedAt": "2025-10-19T10:35:00Z"
  }
}

// Frontend: filter-store (Zustand)
filtersBySheet: {
  Sheet1: { filters: [...], combinator: 'AND' },
  Sheet2: { filters: [...], combinator: 'OR' }
}
```

#### Sheet Switching
1. User clicks Sheet2 tab
2. Update `currentSheet` state
3. Save Sheet1 filters to store (if any changes)
4. Load Sheet2 data (from cache or API)
5. Apply Sheet2 filters from store
6. Re-render data table with Sheet2 data

#### Export Strategy
- **XLSX**: Export all sheets with their respective filters applied
- **CSV**: Export only active sheet with its filters
- **JSON**: Export all sheets as structured data with filters applied

### Performance Considerations

#### Workspace Level
- Lazy load workspace list (pagination)
- Cache workspace metadata client-side
- Debounce workspace search (future)

#### Session Level
- Virtual scrolling for large session lists
- Thumbnail previews (future)
- Recently accessed sessions (future)

#### Sheet Level
- Lazy load sheet data (on-demand)
- Cache loaded sheets in memory
- Virtual scrolling for large sheets
- Web Workers for filter computation (future)

---

## Migration Path: SQLite → Supabase

1. **Phase 1**: Develop with SQLite
   - Fast local development
   - No external dependencies
   - Easy testing

2. **Phase 2**: Dual-write mode
   - Write to both SQLite and Supabase
   - Read from SQLite (verify consistency)

3. **Phase 3**: Switch reads to Supabase
   - Read from Supabase
   - Keep writing to both (safety)

4. **Phase 4**: Deprecate SQLite
   - Stop writing to SQLite
   - Full Supabase migration

5. **Phase 5**: Cleanup
   - Remove SQLite code
   - Archive local data

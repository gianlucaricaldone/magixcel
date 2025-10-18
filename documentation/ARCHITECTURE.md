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
app/                    # Next.js App Router
├── layout.tsx         # Root layout (providers, fonts)
├── page.tsx           # Landing page
├── dashboard/         # Post-upload UI
└── api/               # API endpoints

components/            # React components
├── ui/               # shadcn/ui primitives
├── upload/           # File upload components
├── table/            # Data table components
├── filters/          # Filter UI
└── export/           # Export dialogs

lib/                   # Core business logic
├── db/               # Database abstraction
├── processing/       # File processing
├── storage/          # File storage
├── utils/            # Utilities
└── hooks/            # Custom hooks

stores/               # Zustand state stores
types/                # TypeScript types
```

---

## Data Flow

### File Upload Flow
```
User uploads file
    ↓
FileUploader component
    ↓
POST /api/upload
    ↓
excel-processor.ts / csv-processor.ts
    ↓
Database (session + file)
    ↓
Storage (local/cloud)
    ↓
Return sessionId + metadata
    ↓
Navigate to /dashboard
```

### Filter Application Flow
```
User creates filter
    ↓
FilterBuilder component
    ↓
filter-store (Zustand)
    ↓
POST /api/filter
    ↓
Check cached_results
    ↓ (cache miss)
filter-engine.ts applies filters
    ↓
Cache results
    ↓
Return filtered data
    ↓
DataTable component renders
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
  getSession(id: string): Promise<Session | null>;
  createSession(data: SessionData): Promise<Session>;
  // ... other methods
}

export const db: IDatabase =
  process.env.DATABASE_TYPE === 'supabase'
    ? new SupabaseDB()
    : new SQLiteDB();
```

---

## State Management

### Zustand Stores

#### session-store.ts
```typescript
interface SessionState {
  sessionId: string | null;
  metadata: SessionMetadata | null;
  setSession: (id: string, metadata: SessionMetadata) => void;
  clearSession: () => void;
}
```

#### filter-store.ts
```typescript
interface FilterState {
  filters: Filter[];
  combinator: 'AND' | 'OR';
  addFilter: (filter: Filter) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
}
```

#### data-store.ts
```typescript
interface DataState {
  data: any[];
  totalRows: number;
  filteredRows: number;
  setData: (data: any[]) => void;
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

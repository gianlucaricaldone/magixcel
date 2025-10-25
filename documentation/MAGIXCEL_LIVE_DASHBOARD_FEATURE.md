# MagiXcel Live Dashboard & Reporting Platform
## Feature Specification - Building on Existing Architecture

**Version:** 2.0  
**Date:** October 25, 2025  
**Current MagiXcel Version:** v3.0.0  
**Document Status:** Technical Specification for Implementation  

---

## 1. Executive Summary

### What MagiXcel Currently Has (v3.0.0)

MagiXcel is an Excel/CSV analysis platform with:

**Architecture:**
- **Workspace → Session → Sheet** hierarchy for file organization
- **Adapter Pattern** for environment flexibility (Dev/Prod):
  - DBAdapter: SQLite (dev) / Supabase (prod)
  - StorageAdapter: Local filesystem (dev) / Cloudflare R2 (prod)  
  - CacheAdapter: In-memory Map (dev) / Vercel KV Redis (prod)

**Data Processing:**
- Upload flow: Excel/CSV → JavaScript processing (ExcelJS/PapaParse) → JSON storage
- Filter engine: Client-side JavaScript filtering with Zustand state management
- Export: Generate CSV/Excel from filtered JavaScript arrays

**UI Components:**
- ViewSplitLayout: 3-column resizable layout (Filters | Data | Charts)
- Views system: Save filter configurations as reusable views
- View Charts: Chart.js visualizations linked to views
- DataTable: Virtual scrolling with @tanstack/react-virtual

**Database Schema:**
- `workspaces`: Organize sessions into projects
- `sessions`: Uploaded file metadata and active filters
- `views`: Persistent filter configurations  
- `view_charts`: Chart configurations linked to views
- `active_views`: Track which views are applied to sheets

### What This Feature Adds

Transform MagiXcel into a **Live Business Intelligence Platform** by adding:

1. **DuckDB Analytics Engine** - SQL-based processing replacing JavaScript
2. **Parquet Columnar Storage** - 60-70% file compression, faster queries
3. **Public Dashboard URLs** - Share views with permanent links
4. **Automatic Data Refresh** - Update dashboards when source files change
5. **PowerPoint Generation** - Export view charts to PPT presentations
6. **REST API Access** - Programmatic data access for integrations
7. **Embedding Support** - Embed charts in external websites
8. **Hybrid Processing** - Optional DuckDB-WASM for browser-side analytics

---

## 2. Gap Analysis: Features to Implement

### 2.1 DuckDB Integration ❌ NOT IMPLEMENTED

**Current State:**
```javascript
// Current: JavaScript processing in memory
const processExcel = async (file) => {
  const workbook = XLSX.read(buffer);
  const data = XLSX.utils.sheet_to_json(worksheet);
  // Store entire dataset in memory/database
  await db.saveSession(sessionId, { data: JSON.stringify(data) });
};
```

**What's Needed:**
```javascript
// New: DuckDB direct file processing
const processWithDuckDB = async (file) => {
  // DuckDB reads Excel/CSV directly
  await duckdb.exec(`
    CREATE TABLE session_${id} AS 
    SELECT * FROM read_excel('${filePath}')
  `);
  
  // Convert to Parquet for storage
  await duckdb.exec(`
    COPY session_${id} 
    TO 's3://bucket/parquet/${id}.parquet'
    (FORMAT PARQUET, COMPRESSION 'snappy')
  `);
};
```

### 2.2 Parquet File Format ❌ NOT IMPLEMENTED

**Current State:**
- Original Excel/CSV files stored as-is
- Data extracted to JSON and stored in database
- No compression, full file size

**What's Needed:**
- Dual storage: Original file + Parquet version
- 60-70% compression with Parquet
- Columnar storage for fast column-specific queries
- Direct querying without loading into memory

### 2.3 Public Dashboard URLs ❌ NOT IMPLEMENTED

**Current State:**
- All views are private to workspace
- Access requires authentication
- URLs like: `/app/workspace/[id]/session/[id]`

**What's Needed:**
- Public URLs: `magixcel.com/dashboard/[public-slug]`
- Read-only version of ViewSplitLayout
- Optional password protection
- Share dialog with copy link button

### 2.4 Auto-refresh on File Update ❌ NOT IMPLEMENTED

**Current State:**
- Sessions are immutable snapshots
- No way to update data after upload
- New upload = new session

**What's Needed:**
- Replace session data while keeping same ID
- Automatic view/chart refresh
- Version history (optional)
- Schema compatibility checking

### 2.5 PowerPoint Generation ❌ NOT IMPLEMENTED

**Current State:**
- No PowerPoint export capability
- Only CSV/Excel export of data

**What's Needed:**
- Convert view_charts to PPT slides
- Template system for corporate branding
- Automatic regeneration on data change
- Download link with permanent URL

### 2.6 REST API Access ❌ NOT IMPLEMENTED

**Current State:**
- Internal Next.js API routes only
- No external API access
- No API documentation

**What's Needed:**
- Public API endpoints for view data
- API key authentication
- Rate limiting
- OpenAPI specification
- Webhooks for data changes

### 2.7 Embedding Support ❌ NOT IMPLEMENTED

**Current State:**
- No embedding capability
- Charts only viewable in MagiXcel app

**What's Needed:**
- Embeddable chart URLs
- Responsive iframe sizing
- CORS configuration
- Customization options (colors, branding)

### 2.8 DuckDB-WASM Browser Support ❌ NOT IMPLEMENTED

**Current State:**
- All filtering happens via API calls
- Network latency on every filter change

**What's Needed (Optional but Powerful):**
- Load DuckDB-WASM for small datasets
- Browser-side Parquet queries
- Instant filtering without server roundtrip
- Offline capability

---

## 3. Technical Architecture: DuckDB Integration

### 3.1 Server-Side DuckDB (Required)

**Why Server-Side First:**
- Handles files of any size (1MB to 100GB+)
- No browser memory constraints
- Direct integration with R2/S3 storage
- Shared processing for all users
- No 12MB WASM download for users

**Integration with Existing Adapters:**

```typescript
// NEW FILE: lib/duckdb/DuckDBAdapter.ts
import { Database } from 'duckdb-async';
import { storage } from '@/lib/adapters/storage';
import { cache } from '@/lib/adapters/cache';
import { db } from '@/lib/adapters/db';

export class DuckDBAdapter {
  private database: Database;

  async initialize() {
    this.database = await Database.create(':memory:');
    
    // Enable S3/R2 support
    await this.database.exec(`
      INSTALL httpfs;
      LOAD httpfs;
      SET s3_endpoint='${process.env.R2_ENDPOINT}';
      SET s3_access_key_id='${process.env.R2_ACCESS_KEY}';
      SET s3_secret_access_key='${process.env.R2_SECRET_KEY}';
    `);
  }

  async processUpload(sessionId: string, file: File): Promise<void> {
    // Step 1: Save original file (existing StorageAdapter)
    const originalPath = await storage.upload(sessionId, file, 'original');
    
    // Step 2: Convert to Parquet with DuckDB
    const tempPath = `/tmp/${sessionId}.${file.name}`;
    await fs.writeFile(tempPath, file);
    
    const parquetPath = `s3://bucket/parquet/${sessionId}.parquet`;
    
    if (file.name.endsWith('.csv')) {
      await this.database.exec(`
        COPY (SELECT * FROM read_csv_auto('${tempPath}'))
        TO '${parquetPath}'
        (FORMAT PARQUET, COMPRESSION 'snappy')
      `);
    } else {
      // Excel files
      await this.database.exec(`
        INSTALL spatial; LOAD spatial;
        COPY (SELECT * FROM st_read('${tempPath}'))  
        TO '${parquetPath}'
        (FORMAT PARQUET, COMPRESSION 'snappy')
      `);
    }
    
    // Step 3: Extract metadata
    const schema = await this.database.all(`
      DESCRIBE SELECT * FROM read_parquet('${parquetPath}')
    `);
    
    const stats = await this.database.get(`
      SELECT COUNT(*) as row_count,
             COUNT(*) as column_count
      FROM read_parquet('${parquetPath}')
    `);
    
    // Step 4: Update session (existing DBAdapter)
    await db.updateSession(sessionId, {
      r2_path_original: originalPath,
      r2_path_parquet: parquetPath,  // NEW FIELD NEEDED
      metadata: {
        schema,
        ...stats,
        parquetSize: await storage.getFileSize(parquetPath),
        compressionRatio: file.size / parquetSize
      }
    });
    
    // Clean up temp file
    await fs.unlink(tempPath);
  }

  async queryView(sessionId: string, viewConfig: any): Promise<any[]> {
    // Check cache first (existing CacheAdapter)
    const cacheKey = `view:${sessionId}:${JSON.stringify(viewConfig)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    // Get Parquet path from session
    const session = await db.getSession(sessionId);
    const parquetPath = session.r2_path_parquet;
    
    // Build SQL from existing filter config format
    const whereClause = this.buildWhereClause(viewConfig.filter_config);
    
    // Execute query on Parquet file
    const result = await this.database.all(`
      SELECT * FROM read_parquet('${parquetPath}')
      WHERE ${whereClause}
      LIMIT 10000
    `);
    
    // Cache result (existing CacheAdapter)
    await cache.set(cacheKey, result, { ttl: 3600 });
    
    return result;
  }

  private buildWhereClause(filterConfig: any): string {
    if (!filterConfig.filters || filterConfig.filters.length === 0) {
      return '1=1';
    }
    
    // Convert MagiXcel's FilterConfig to SQL
    const conditions = filterConfig.filters.map((filter: Filter) => {
      const column = filter.column;
      const value = filter.value;
      
      switch (filter.operator) {
        case 'equals':
          return `${column} = '${value}'`;
        case 'notEquals':
          return `${column} != '${value}'`;
        case 'contains':
          return `LOWER(CAST(${column} AS VARCHAR)) LIKE LOWER('%${value}%')`;
        case 'notContains':
          return `LOWER(CAST(${column} AS VARCHAR)) NOT LIKE LOWER('%${value}%')`;
        case 'greaterThan':
          return `${column} > ${value}`;
        case 'lessThan':
          return `${column} < ${value}`;
        case 'greaterThanOrEqual':
          return `${column} >= ${value}`;
        case 'lessThanOrEqual':
          return `${column} <= ${value}`;
        case 'between':
          return `${column} BETWEEN ${value[0]} AND ${value[1]}`;
        case 'in':
          return `${column} IN (${value.map(v => `'${v}'`).join(',')})`;
        case 'notIn':
          return `${column} NOT IN (${value.map(v => `'${v}'`).join(',')})`;
        case 'isEmpty':
          return `${column} IS NULL OR ${column} = ''`;
        case 'isNotEmpty':
          return `${column} IS NOT NULL AND ${column} != ''`;
        default:
          return '1=1';
      }
    });
    
    // Combine with AND/OR
    return `(${conditions.join(` ${filterConfig.combinator} `)})`;
  }
}

// Export singleton instance
export const duckdb = new DuckDBAdapter();
```

### 3.2 Browser DuckDB-WASM (Optional Enhancement)

**When to Use DuckDB-WASM:**
- Dataset < 10MB Parquet (100MB original)
- User needs instant filtering without network latency  
- Offline capability required
- Real-time pivot tables or aggregations

**When NOT to Use:**
- Large datasets (>10MB Parquet)
- Mobile devices (12MB download)
- Simple filtering (current approach is fine)

**Implementation Strategy:**

```typescript
// NEW FILE: hooks/useDuckDBWasm.ts
import { useEffect, useState } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

export function useDuckDBWasm(sessionId: string, fileSize: number) {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDuckDB() {
      // Decision logic: Only load WASM for small files
      const WASM_SIZE_LIMIT = 10_000_000; // 10MB Parquet
      const WASM_DOWNLOAD_SIZE = 12_000_000; // 12MB gzipped
      
      // Check if it's worth downloading WASM
      if (fileSize > WASM_SIZE_LIMIT) {
        console.log('File too large for WASM, using server-side DuckDB');
        return;
      }
      
      // Check if user is on mobile/slow connection
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        console.log('Slow connection detected, using server-side DuckDB');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Load WASM bundles from CDN
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        
        // Create worker
        const worker = new Worker(
          URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], {
              type: 'application/javascript',
            })
          )
        );
        
        // Initialize DuckDB
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        
        // Register Parquet file from R2
        const conn = await db.connect();
        await conn.query(`
          CREATE TABLE session_data AS 
          SELECT * FROM 'https://r2.cloudflare.com/parquet/${sessionId}.parquet'
        `);
        await conn.close();
        
        setDb(db);
      } catch (err) {
        console.error('Failed to load DuckDB-WASM:', err);
        setError('Failed to load browser analytics');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDuckDB();
  }, [sessionId, fileSize]);
  
  return { db, isLoading, error };
}

// Usage in DataTable component
export function DataTable({ sessionId, columns, filterConfig }) {
  const session = useSessionStore(state => state.session);
  const { db: wasmDB, isLoading: wasmLoading } = useDuckDBWasm(
    sessionId, 
    session?.metadata?.parquetSize || 0
  );
  
  const [data, setData] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const applyFilters = async () => {
    setIsFiltering(true);
    
    try {
      if (wasmDB) {
        // Browser-side filtering with DuckDB-WASM
        console.log('Using DuckDB-WASM for instant filtering');
        
        const conn = await wasmDB.connect();
        const whereClause = buildWhereClause(filterConfig);
        
        const result = await conn.query(`
          SELECT * FROM session_data
          WHERE ${whereClause}
          LIMIT 10000
        `);
        
        const arrayResult = result.toArray().map(row => row.toJSON());
        setData(arrayResult);
        
        await conn.close();
      } else {
        // Server-side filtering (current approach)
        console.log('Using server-side DuckDB');
        
        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, filterConfig })
        });
        
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Filter error:', error);
      // Fallback to server if WASM fails
      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filterConfig })
      });
      const result = await response.json();
      setData(result.data);
    } finally {
      setIsFiltering(false);
    }
  };
  
  // Show loading state while WASM loads
  if (wasmLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">
            Loading browser analytics engine (12MB)...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            This happens once per session
          </p>
        </div>
      </div>
    );
  }
  
  // Rest of DataTable component...
}
```

---

## 4. Implementation Roadmap

### Phase 1: DuckDB Foundation (Week 1-2)

**1.1 Database Schema Updates**
```sql
-- Add to existing sessions table
ALTER TABLE sessions ADD COLUMN r2_path_parquet TEXT;
ALTER TABLE sessions ADD COLUMN parquet_size BIGINT;
ALTER TABLE sessions ADD COLUMN compression_ratio DECIMAL(5,2);

-- Add to existing views table for public access
ALTER TABLE views ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE views ADD COLUMN public_slug TEXT UNIQUE;
ALTER TABLE views ADD COLUMN access_password TEXT;
ALTER TABLE views ADD COLUMN last_accessed TIMESTAMPTZ;
ALTER TABLE views ADD COLUMN access_count INTEGER DEFAULT 0;
```

**1.2 DuckDB Integration**
- Install `duckdb-async` package
- Create `DuckDBAdapter` class
- Integrate with existing adapters
- Update upload flow to generate Parquet

**1.3 Update Upload Endpoint**
```typescript
// Modify app/api/upload/route.ts
import { duckdb } from '@/lib/duckdb/DuckDBAdapter';

export async function POST(request: NextRequest) {
  try {
    // ... existing file validation ...
    
    // NEW: Process with DuckDB
    await duckdb.initialize();
    await duckdb.processUpload(sessionId, file);
    
    // ... rest of existing logic ...
  } catch (error) {
    // ... error handling ...
  }
}
```

### Phase 2: Query Migration (Week 3-4)

**2.1 Replace Filter Endpoint**
```typescript
// Modify app/api/filter/route.ts
import { duckdb } from '@/lib/duckdb/DuckDBAdapter';

export async function POST(request: NextRequest) {
  const { sessionId, filters, combinator, globalSearch } = await request.json();
  
  try {
    // Build filter config (existing logic)
    const filterConfig = {
      filters,
      combinator,
      globalSearch
    };
    
    // NEW: Query with DuckDB instead of JavaScript
    const data = await duckdb.queryView(sessionId, filterConfig);
    
    return NextResponse.json({
      success: true,
      data,
      totalRows: data.length,
      cached: false
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**2.2 Performance Comparison**
- Benchmark: Current JavaScript vs DuckDB
- Expected: 50-100x faster on 1M+ rows
- Document query optimization patterns

### Phase 3: Public Dashboards (Week 5-6)

**3.1 Public View Route**
```typescript
// NEW FILE: app/dashboard/[slug]/page.tsx
import { ViewSplitLayout } from '@/components/workspace/ViewSplitLayout';
import { duckdb } from '@/lib/duckdb/DuckDBAdapter';

export default async function PublicDashboard({ 
  params 
}: { 
  params: { slug: string } 
}) {
  // Get view by public slug
  const view = await db.getViewByPublicSlug(params.slug);
  
  if (!view || !view.is_public) {
    return <NotFound />;
  }
  
  // Check password if protected
  // ... password logic ...
  
  // Load session data with DuckDB
  const data = await duckdb.queryView(
    view.session_id,
    JSON.parse(view.filter_config)
  );
  
  // Load charts
  const charts = await db.getViewCharts(view.id);
  
  // Render in read-only mode
  return (
    <div className="h-screen bg-slate-50">
      <ViewSplitLayout
        view={view}
        charts={charts}
        data={data}
        columns={Object.keys(data[0] || {})}
        readOnly={true}
        showHeader={false}
        showToolbar={false}
      />
    </div>
  );
}
```

**3.2 Share Dialog Component**
```typescript
// NEW FILE: components/views/ShareViewDialog.tsx
export function ShareViewDialog({ view, isOpen, onClose }) {
  const [isPublic, setIsPublic] = useState(view.is_public);
  const [password, setPassword] = useState('');
  
  const publicUrl = `${window.location.origin}/dashboard/${view.public_slug}`;
  
  const handleMakePublic = async () => {
    const slug = generateSlug(view.name);
    
    await fetch(`/api/views/${view.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        is_public: true,
        public_slug: slug,
        access_password: password || null
      })
    });
    
    setIsPublic(true);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share View: {view.name}</DialogTitle>
        </DialogHeader>
        
        {!isPublic ? (
          <div className="space-y-4">
            <p>Make this view publicly accessible?</p>
            
            <div className="space-y-2">
              <Label>Password Protection (optional)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for public access"
              />
            </div>
            
            <Button onClick={handleMakePublic}>
              Make Public
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded">
              <Input
                value={publicUrl}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-slate-600">
              Anyone with this link can view the dashboard
              {view.access_password && ' (password protected)'}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 4: Auto-refresh System (Week 7-8)

**4.1 File Update Endpoint**
```typescript
// NEW ENDPOINT: app/api/session/[id]/refresh/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Validate schema compatibility
  const existingSession = await db.getSession(params.id);
  const existingSchema = existingSession.metadata.schema;
  
  // Process new file with DuckDB
  const newSchema = await duckdb.extractSchema(file);
  
  if (!schemasCompatible(existingSchema, newSchema)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'New file structure does not match existing' 
      },
      { status: 400 }
    );
  }
  
  // Replace Parquet file
  await duckdb.processUpload(params.id, file);
  
  // Invalidate all caches for this session
  await cache.invalidatePattern(`session:${params.id}:*`);
  
  // Update last_refresh timestamp
  await db.updateSession(params.id, {
    updated_at: new Date().toISOString()
  });
  
  // Notify connected clients via WebSocket (future)
  // await notifyClients(params.id, 'data_refreshed');
  
  return NextResponse.json({
    success: true,
    message: 'Session data refreshed successfully'
  });
}
```

**4.2 Auto-refresh UI Component**
```typescript
// NEW FILE: components/session/AutoRefreshIndicator.tsx
export function AutoRefreshIndicator({ session }) {
  const [lastRefresh, setLastRefresh] = useState(session.updated_at);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async (file: File) => {
    setIsRefreshing(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`/api/session/${session.id}/refresh`, {
      method: 'PUT',
      body: formData
    });
    
    if (response.ok) {
      setLastRefresh(new Date().toISOString());
      // Trigger data reload
      window.location.reload();
    }
    
    setIsRefreshing(false);
  };
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4" />
        Last updated: {formatRelative(lastRefresh)}
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => document.getElementById('refresh-file')?.click()}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Update Data
      </Button>
      
      <input
        id="refresh-file"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleRefresh(file);
        }}
      />
    </div>
  );
}
```

### Phase 5: PowerPoint Generation (Week 9-10)

**5.1 PPT Generator Service**
```typescript
// NEW FILE: lib/ppt/PowerPointGenerator.ts
import PptxGenJS from 'pptxgenjs';

export class PowerPointGenerator {
  async generateFromView(viewId: string): Promise<Buffer> {
    const view = await db.getView(viewId);
    const charts = await db.getViewCharts(viewId);
    const session = await db.getSession(view.session_id);
    
    // Create presentation
    const pptx = new PptxGenJS();
    
    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(view.name, {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 36,
      bold: true
    });
    titleSlide.addText(view.description || '', {
      x: 1,
      y: 2.5,
      w: 8,
      h: 1,
      fontSize: 18
    });
    
    // Generate slides for each chart
    for (const chart of charts) {
      const slide = pptx.addSlide();
      
      // Add chart title
      slide.addText(chart.title, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.7,
        fontSize: 24,
        bold: true
      });
      
      // Get chart data from DuckDB
      const data = await duckdb.queryView(
        session.id,
        JSON.parse(view.filter_config)
      );
      
      // Convert to chart format based on type
      const chartData = this.prepareChartData(
        data,
        JSON.parse(chart.config)
      );
      
      // Add chart to slide
      slide.addChart(pptx.ChartType[chart.chart_type], chartData, {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 4.5
      });
    }
    
    // Generate buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    return buffer;
  }
  
  private prepareChartData(data: any[], config: any) {
    // Convert data to PptxGenJS format
    // ... implementation based on chart type ...
  }
}
```

**5.2 PPT Download Endpoint**
```typescript
// NEW FILE: app/api/views/[id]/ppt/route.ts
import { PowerPointGenerator } from '@/lib/ppt/PowerPointGenerator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const generator = new PowerPointGenerator();
  const pptBuffer = await generator.generateFromView(params.id);
  
  return new Response(pptBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="dashboard-${params.id}.pptx"`,
      'Cache-Control': 'no-cache'
    }
  });
}
```

### Phase 6: DuckDB-WASM Integration (Week 11-12) - Optional

**6.1 Progressive Enhancement Strategy**
```typescript
// Modify stores/data-store.ts
interface DataState {
  // Existing state...
  
  // NEW: DuckDB-WASM state
  wasmEnabled: boolean;
  wasmDB: any | null;
  setWasmDB: (db: any) => void;
  
  // NEW: Query method that uses WASM if available
  queryData: async (filterConfig: FilterConfig) => {
    const state = get();
    
    if (state.wasmEnabled && state.wasmDB) {
      // Use WASM for instant results
      return await queryWithWASM(state.wasmDB, filterConfig);
    } else {
      // Fallback to server
      return await queryWithServer(filterConfig);
    }
  };
}
```

**6.2 User Preference Setting**
```typescript
// Add to Settings page
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label>Browser Analytics (Beta)</Label>
      <p className="text-sm text-slate-600">
        Enable client-side processing for faster filtering.
        Requires 12MB download.
      </p>
    </div>
    <Switch
      checked={settings.enableWASM}
      onCheckedChange={(checked) => {
        updateSettings({ enableWASM: checked });
        if (checked) {
          loadDuckDBWASM();
        }
      }}
    />
  </div>
</div>
```

---

## 5. Database Schema Changes

### Required Schema Updates

```sql
-- 1. Update sessions table
ALTER TABLE sessions 
ADD COLUMN r2_path_parquet TEXT,
ADD COLUMN parquet_size BIGINT,
ADD COLUMN compression_ratio DECIMAL(5,2),
ADD COLUMN allow_refresh BOOLEAN DEFAULT false,
ADD COLUMN last_refresh TIMESTAMPTZ;

-- 2. Update views table for public access
ALTER TABLE views 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN public_slug TEXT UNIQUE,
ADD COLUMN access_password TEXT,
ADD COLUMN last_accessed TIMESTAMPTZ,
ADD COLUMN access_count INTEGER DEFAULT 0,
ADD COLUMN embed_enabled BOOLEAN DEFAULT false;

-- 3. Create API keys table (new)
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions JSONB DEFAULT '["read"]',
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Create refresh_history table (new)
CREATE TABLE refresh_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  original_file_name TEXT,
  file_size BIGINT,
  rows_before INTEGER,
  rows_after INTEGER,
  refresh_type TEXT CHECK(refresh_type IN ('manual', 'scheduled', 'api')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Add indexes for performance
CREATE INDEX idx_views_public_slug ON views(public_slug) WHERE is_public = true;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_refresh_history_session ON refresh_history(session_id, created_at DESC);
```

---

## 6. API Design

### New Public API Endpoints

```typescript
// Public Dashboard Access
GET /api/public/dashboard/:slug
  Response: {
    view: ViewData,
    charts: ChartData[],
    data: any[],
    metadata: {
      lastUpdated: string,
      rowCount: number,
      isPasswordProtected: boolean
    }
  }

// Public Data API
GET /api/public/data/:slug
  Query: ?format=json|csv&limit=1000&offset=0
  Headers: X-API-Key (optional for rate limiting)
  Response: data in requested format

// Chart Embed API  
GET /api/public/embed/:slug/chart/:chartId
  Response: HTML page with embedded chart

// PowerPoint Download
GET /api/public/ppt/:slug
  Response: Binary PPTX file

// Refresh Session Data
PUT /api/session/:id/refresh
  Body: FormData with new file
  Response: { success: true, rowsProcessed: number }

// API Key Management
POST /api/workspace/:id/api-keys
  Body: { name: string, permissions: string[] }
  Response: { apiKey: string (shown once) }

GET /api/workspace/:id/api-keys
  Response: ApiKey[] (without actual keys)

DELETE /api/workspace/:id/api-keys/:keyId
```

---

## 7. Performance Considerations

### DuckDB Performance Expectations

**Current JavaScript Processing:**
- 100k rows: 2-5 seconds to filter
- 1M rows: 20-30 seconds (often crashes)
- Memory usage: Full dataset in RAM

**With DuckDB + Parquet:**
- 100k rows: 10-50ms to filter
- 1M rows: 50-200ms to filter
- 10M rows: 200ms-1s to filter
- Memory usage: Only query results in RAM

### Optimization Strategies

1. **Parquet Partitioning** for huge datasets:
```sql
COPY data TO 's3://bucket/session/data'
PARTITION BY (year, month)
FORMAT PARQUET;
```

2. **Materialized Views** for common aggregations:
```sql
CREATE MATERIALIZED VIEW monthly_summary AS
SELECT DATE_TRUNC('month', date) as month,
       SUM(amount) as total
FROM session_data
GROUP BY month;
```

3. **Query Result Caching**:
- Use existing CacheAdapter
- Cache key includes data version
- Auto-invalidate on refresh

4. **Progressive Loading**:
- Load first 100 rows instantly
- Background load rest
- Virtual scrolling for large results

---

## 8. Migration Guide

### For Existing MagiXcel Installations

#### Step 1: Database Migration
```bash
# Run migration script
npm run migrate:add-duckdb-fields

# This will:
# - Add new columns to sessions table
# - Add new columns to views table  
# - Create new tables (api_keys, refresh_history)
```

#### Step 2: Backfill Parquet Files
```typescript
// Script to convert existing sessions to Parquet
async function migrateExistingSessions() {
  const sessions = await db.getAllSessions();
  
  for (const session of sessions) {
    if (!session.r2_path_parquet) {
      console.log(`Converting session ${session.id} to Parquet...`);
      
      // Download original file
      const originalFile = await storage.download(session.r2_path_original);
      
      // Convert to Parquet
      const parquetPath = await duckdb.convertToParquet(
        session.id,
        originalFile
      );
      
      // Update session
      await db.updateSession(session.id, {
        r2_path_parquet: parquetPath
      });
    }
  }
}
```

#### Step 3: Update Environment Variables
```bash
# .env.local (development)
DUCKDB_MEMORY_LIMIT=2GB
DUCKDB_THREADS=4
ENABLE_WASM=false

# .env.production
DUCKDB_MEMORY_LIMIT=8GB
DUCKDB_THREADS=8
ENABLE_WASM=true
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
```

---

## 9. Testing Strategy

### Unit Tests
```typescript
// lib/duckdb/__tests__/DuckDBAdapter.test.ts
describe('DuckDBAdapter', () => {
  it('should convert CSV to Parquet', async () => {
    const file = new File(['name,age\nJohn,30'], 'test.csv');
    const parquetPath = await duckdb.convertToParquet('test-id', file);
    expect(parquetPath).toContain('.parquet');
  });
  
  it('should build correct SQL from FilterConfig', () => {
    const filterConfig = {
      filters: [
        { column: 'age', operator: 'greaterThan', value: 25 }
      ],
      combinator: 'AND'
    };
    const sql = duckdb.buildWhereClause(filterConfig);
    expect(sql).toBe('(age > 25)');
  });
});
```

### Integration Tests
```typescript
// e2e/public-dashboard.spec.ts
test('should access public dashboard', async ({ page }) => {
  // Make view public
  await page.goto('/app/workspace/default/session/test-session');
  await page.click('[data-testid="share-view"]');
  await page.click('[data-testid="make-public"]');
  
  const publicUrl = await page.locator('[data-testid="public-url"]').inputValue();
  
  // Access public dashboard
  await page.goto(publicUrl);
  await expect(page).toHaveTitle(/Dashboard/);
  await expect(page.locator('[data-testid="chart"]')).toBeVisible();
});
```

### Performance Benchmarks
```typescript
// benchmarks/duckdb-performance.ts
async function benchmark() {
  const sizes = [1000, 10000, 100000, 1000000];
  
  for (const size of sizes) {
    // Generate test data
    const csvFile = generateCSV(size);
    
    // Measure JavaScript processing
    const jsStart = Date.now();
    await processWithJavaScript(csvFile);
    const jsTime = Date.now() - jsStart;
    
    // Measure DuckDB processing
    const duckStart = Date.now();
    await processWithDuckDB(csvFile);
    const duckTime = Date.now() - duckStart;
    
    console.log(`Size: ${size} rows`);
    console.log(`  JavaScript: ${jsTime}ms`);
    console.log(`  DuckDB: ${duckTime}ms`);
    console.log(`  Speedup: ${(jsTime / duckTime).toFixed(2)}x`);
  }
}
```

---

## 10. Security Considerations

### Public Dashboard Security
- Rate limiting on public endpoints
- Password protection option
- No edit capabilities on public views
- Watermark on public dashboards (optional)
- Access logging for audit trail

### API Security
- API key authentication
- Rate limiting per key
- Scope-based permissions
- Key rotation support
- Audit logging

### Data Security
- Parquet files encrypted at rest (R2)
- HTTPS only for public access
- Row-level security (future)
- Data masking for sensitive columns (future)

---

## 11. Cost-Benefit Analysis

### Implementation Costs
- Development: 12 weeks (1 developer)
- DuckDB learning curve: 1 week
- Testing and optimization: 2 weeks
- Total: ~15 weeks effort

### Infrastructure Costs
- R2 Storage: $0.015/GB/month (Parquet is 60-70% smaller)
- DuckDB: Free open source
- CDN for WASM: ~$10/month
- Total additional cost: ~$10-20/month

### Benefits
- **Performance**: 50-100x faster queries
- **Scalability**: Handle 10M+ row datasets
- **Features**: Public dashboards, PPT export, API access
- **User Experience**: Instant filtering with WASM
- **Market Position**: "Tableau for Excel users"

### ROI
- Current: $29/user/month
- With features: $49-99/user/month potential
- Conversion rate increase: Est. 2-3x
- Payback period: 2-3 months

---

## 12. Conclusion

The Live Dashboard & Reporting Platform feature transforms MagiXcel from a data filtering tool into a comprehensive Business Intelligence platform. By integrating DuckDB with the existing architecture, we can:

1. **Maintain backward compatibility** - Existing views and charts continue to work
2. **Dramatically improve performance** - 50-100x faster on large datasets
3. **Enable new use cases** - Public dashboards, auto-refresh, API access
4. **Reduce infrastructure costs** - 60-70% storage savings with Parquet
5. **Provide offline capability** - Optional DuckDB-WASM for browser

The implementation is achievable in 12 weeks by building on MagiXcel's existing foundation of views, charts, and adapters. The hybrid approach (server + optional WASM) ensures we can handle any dataset size while providing the best possible user experience.

This positions MagiXcel as the "**Tableau for Excel users**" - bringing enterprise BI capabilities to the 750 million Excel users worldwide at a fraction of the cost and complexity.

---

**Document prepared for:** MagiXcel Development Team  
**Next steps:** Review with team, prioritize phases, begin Phase 1 implementation
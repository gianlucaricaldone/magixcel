# API Endpoints

All API endpoints are located in `app/api/` and follow Next.js 14 App Router conventions.

## Workspaces

### GET /api/workspace
List all workspaces.

**Query Parameters:**
- `limit` (optional): Number of workspaces to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```typescript
{
  success: boolean;
  workspaces: IWorkspace[];
  count: number;
}
```

### POST /api/workspace
Create a new workspace.

**Request:**
```typescript
{
  name: string; // Required
  description?: string;
  color?: string; // Hex color (default: '#3B82F6')
  icon?: string; // Icon identifier (default: 'folder')
}
```

**Response:**
```typescript
{
  success: boolean;
  workspace: IWorkspace;
}
```

**Errors:**
- 400: Invalid workspace name (VALIDATION_ERROR)
- 500: Creation failed (PROCESSING_ERROR)

### GET /api/workspace/:id
Get a single workspace by ID.

**Response:**
```typescript
{
  success: boolean;
  workspace: IWorkspace;
}
```

**Errors:**
- 404: Workspace not found (NOT_FOUND)
- 500: Retrieval failed (PROCESSING_ERROR)

### PUT /api/workspace/:id
Update a workspace.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  workspace: IWorkspace;
}
```

**Errors:**
- 404: Workspace not found (NOT_FOUND)
- 400: Invalid data (VALIDATION_ERROR)
- 500: Update failed (PROCESSING_ERROR)

### DELETE /api/workspace/:id
Delete a workspace and all its sessions.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Errors:**
- 400: Cannot delete default workspace (VALIDATION_ERROR)
- 404: Workspace not found (NOT_FOUND)
- 500: Deletion failed (PROCESSING_ERROR)

### GET /api/workspace/:id/sessions
List all sessions in a workspace.

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```typescript
{
  success: boolean;
  workspace: IWorkspace;
  sessions: ISession[];
  count: number;
}
```

---

## Upload

### POST /api/upload
Upload and process Excel/CSV files using DuckDB.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  ```typescript
  {
    file: File; // Excel or CSV file (max 1GB)
    sessionName?: string; // Optional session name
    workspaceId?: string; // Optional workspace ID (default: 'default')
  }
  ```

**Processing Pipeline (DuckDB):**
1. Save file to temp directory
2. **DuckDB reads file**: `read_excel()` or `read_csv()`
3. **Extract metadata**: Sheets, columns, types, row counts
4. **Convert to Parquet**: `COPY ... TO 'output.parquet'` (60-70% compression)
5. **Upload to storage**:
   - Original: `/files/{sessionId}/original.xlsx` (via StorageAdapter)
   - Parquet: `/files/{sessionId}/data.parquet` (via StorageAdapter)
6. **Save to database** (via DBAdapter):
   - Session record with `r2_path_original`, `r2_path_parquet`
   - Metadata JSONB (sheets, columns, stats)
7. **Return session ID** + metadata

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  metadata: {
    fileName: string;
    fileSize: number;
    sheets: Array<{
      name: string;
      rowCount: number;
      columnCount: number;
      columns: Array<{name: string, type: string}>;
    }>;
    parquetSize: number;
    compressionRatio: number; // e.g. 0.42 (58% compression)
    processingTime: number; // milliseconds
  };
}
```

**Errors:**
- 400: Invalid file type (only .xlsx, .xls, .csv allowed)
- 413: File too large (>1GB)
- 500: DuckDB processing error or storage upload failure

**Performance:**
- 100k rows: ~3 seconds (includes Parquet conversion)
- 1M rows: ~15 seconds

---

## Filter

### POST /api/filter
Apply filters to session data using DuckDB queries.

**Request:**
```typescript
{
  sessionId: string;
  sheetName?: string; // For multi-sheet Excel files
  filters: {
    column: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'notEquals' | 'in' | 'notIn';
    value: any;
  }[];
  combinator: 'AND' | 'OR';
  globalSearch?: string; // Search across all columns
  pagination?: {
    page: number;
    pageSize: number;
  };
}
```

**Query Execution Flow (DuckDB + Cache):**
1. **Generate cache key**: `hash(sessionId + filterConfig)`
2. **Check CacheAdapter**: If cache hit → return cached results (sub-10ms)
3. **If cache miss**:
   - Get session from DBAdapter (includes `r2_path_parquet`)
   - Build SQL query from FilterConfig (via query-builder.ts)
   - DuckDB executes query on Parquet file
   - Cache result (Vercel KV, 1h TTL)
4. **Return filtered data** + pagination metadata

**Example DuckDB Query:**
```sql
SELECT *
FROM read_parquet('https://r2.../data.parquet')
WHERE 1=1
  AND sheet_name = 'Q1_Sales'
  AND amount > 1000
  AND region IN ('EU', 'US')
  AND (
    CAST(amount AS VARCHAR) LIKE '%apple%'
    OR CAST(region AS VARCHAR) LIKE '%apple%'
  )
ORDER BY id ASC
LIMIT 100 OFFSET 0;
```

**Response:**
```typescript
{
  success: boolean;
  results: {
    data: any[]; // Rows for current page
    totalRows: number; // Total rows in dataset
    filteredRows: number; // Rows after filter
    page: number;
    pageSize: number;
    totalPages: number;
  };
  executionTime: number; // Query time in milliseconds
  cached: boolean; // Whether result was from cache
}
```

**Errors:**
- 404: Session not found
- 400: Invalid filter configuration
- 500: DuckDB query error or storage access failure

**Performance:**
- Cached queries: <10ms
- Uncached queries: 50-200ms (even on 1M rows)
- DuckDB optimizations: Predicate pushdown, column projection

---

## Export

### POST /api/export
Export filtered results to various formats.

**Request:**
```typescript
{
  sessionId: string;
  filterHash?: string; // Optional, for cached results
  format: 'csv' | 'xlsx' | 'json';
  options?: {
    includeHeaders?: boolean;
    delimiter?: string; // For CSV
    sheetName?: string; // For XLSX
  };
}
```

**Response:**
- Content-Type: Based on format
  - CSV: `text/csv`
  - XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - JSON: `application/json`
- Content-Disposition: `attachment; filename="export-{timestamp}.{ext}"`
- Body: File data

**Errors:**
- 404: Session not found
- 400: Invalid format
- 500: Export generation error

---

## Analyze

### POST /api/analyze
Analyze data patterns and provide insights.

**Request:**
```typescript
{
  sessionId: string;
  analysisType: 'summary' | 'patterns' | 'duplicates' | 'outliers';
  columns?: string[]; // Optional, specific columns to analyze
}
```

**Response:**
```typescript
{
  success: boolean;
  analysis: {
    type: string;
    results: {
      // Structure varies by analysis type
      summary?: {
        totalRows: number;
        columnStats: {
          [column: string]: {
            type: 'string' | 'number' | 'date' | 'boolean';
            uniqueValues: number;
            nullCount: number;
            min?: any;
            max?: any;
            avg?: number;
          };
        };
      };
      patterns?: {
        column: string;
        pattern: string;
        frequency: number;
      }[];
      duplicates?: {
        columns: string[];
        duplicateRows: number;
        examples: any[];
      };
      outliers?: {
        column: string;
        method: string;
        outliers: any[];
      }[];
    };
  };
}
```

**Errors:**
- 404: Session not found
- 400: Invalid analysis type
- 500: Analysis error

---

## Session Management

### GET /api/session/:id
Get session metadata.

**Response:**
```typescript
{
  success: boolean;
  session: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    fileName: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
}
```

### DELETE /api/session/:id
Delete session and associated data.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Views (Persistent Filters)

### GET /api/views
List all views for a workspace/session.

**Query Parameters:**
- `workspaceId` (required): Workspace ID
- `sessionId` (optional): Filter views for specific session

**Response:**
```typescript
{
  success: boolean;
  views: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    filterConfig: FilterConfig;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### POST /api/views
Create a new view (save current filter state).

**Request:**
```typescript
{
  name: string;
  description?: string;
  category?: string;
  filterConfig: FilterConfig; // Current filter configuration
  workspaceId: string;
  sessionId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  view: IView;
}
```

### GET /api/views/:id
Get a single view by ID.

**Response:**
```typescript
{
  success: boolean;
  view: IView;
}
```

### PUT /api/views/:id
Update a view.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  category?: string;
  filterConfig?: FilterConfig;
}
```

**Response:**
```typescript
{
  success: boolean;
  view: IView;
}
```

### DELETE /api/views/:id
Delete a view and all associated charts.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### GET /api/views/:id/charts
Get all charts for a view.

**Response:**
```typescript
{
  success: boolean;
  charts: Array<{
    id: string;
    title: string;
    chartType: string;
    config: ChartConfig;
    size: string;
    position: number;
  }>;
}
```

### POST /api/views/:id/charts
Create a new chart for a view.

**Request:**
```typescript
{
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
  config: ChartConfig;
  size?: 'small' | 'medium' | 'large';
}
```

**Response:**
```typescript
{
  success: boolean;
  chart: IViewChart;
}
```

---

## Active Views

### GET /api/active-views
Get active views for a session/sheet.

**Query Parameters:**
- `sessionId` (required): Session ID
- `sheetName` (optional): Sheet name (null for CSV)

**Response:**
```typescript
{
  success: boolean;
  activeViews: Array<{
    id: string;
    viewId: string;
    view: IView; // Populated view object
    createdAt: string;
  }>;
}
```

**Behavior:**
- Multiple views can be active on the same sheet
- Filters from all active views are combined with AND logic

### POST /api/active-views
Activate a view on a sheet (apply its filters).

**Request:**
```typescript
{
  sessionId: string;
  sheetName: string | null; // null for CSV files
  viewId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  activeView: {
    id: string;
    sessionId: string;
    sheetName: string | null;
    viewId: string;
    createdAt: string;
  };
}
```

**Errors:**
- 409: View already active on this sheet

### DELETE /api/active-views
Deactivate a view from a sheet.

**Query Parameters:**
- `sessionId` (required): Session ID
- `sheetName` (optional): Sheet name
- `viewId` (required): View ID to deactivate

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Error Handling

All endpoints follow a consistent error format:

```typescript
{
  success: false;
  error: {
    code: string; // ERROR_CODE
    message: string; // User-friendly message
    details?: any; // Additional error details
  };
}
```

### Common Error Codes
- `INVALID_FILE_TYPE`: Unsupported file format
- `FILE_TOO_LARGE`: Exceeds size limit
- `SESSION_NOT_FOUND`: Invalid session ID
- `PROCESSING_ERROR`: File processing failed
- `INVALID_FILTER`: Malformed filter configuration
- `EXPORT_FAILED`: Export generation failed
- `ANALYSIS_FAILED`: Analysis execution failed

---

## Rate Limiting
(Future implementation)
- Upload: 10 requests/hour per IP
- Filter: 100 requests/minute per session
- Export: 20 requests/hour per session
- Analyze: 50 requests/hour per session

# API Endpoints

All API endpoints are located in `app/api/` and follow Next.js 14 App Router conventions.

## Upload

### POST /api/upload
Upload and process Excel/CSV files.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  ```typescript
  {
    file: File; // Excel or CSV file
    sessionName?: string; // Optional session name
  }
  ```

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  metadata: {
    fileName: string;
    fileSize: number;
    rowCount: number;
    columnCount: number;
    columns: string[];
    preview: any[]; // First 10 rows
  };
}
```

**Errors:**
- 400: Invalid file type
- 413: File too large (>1GB)
- 500: Processing error

---

## Filter

### POST /api/filter
Apply filters to session data.

**Request:**
```typescript
{
  sessionId: string;
  filters: {
    column: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'notEquals';
    value: any;
  }[];
  combinator: 'AND' | 'OR';
  pagination?: {
    page: number;
    pageSize: number;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  results: {
    data: any[];
    totalRows: number;
    filteredRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filterHash: string; // For caching
}
```

**Errors:**
- 404: Session not found
- 400: Invalid filter configuration
- 500: Filter execution error

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

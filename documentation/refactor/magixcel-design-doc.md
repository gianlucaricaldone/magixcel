# MagiXcel - Complete Design Document 📋

**Version:** 2.0  
**Date:** Octover 2025  
**Status:** Architecture Redesign with DuckDB  
**Author:** Product & Engineering Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema](#3-database-schema)
4. [API Specification](#4-api-specification)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Data Processing Pipeline](#6-data-processing-pipeline)
7. [Feature Specifications](#7-feature-specifications)
8. [Security & Compliance](#8-security--compliance)
9. [Performance Requirements](#9-performance-requirements)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Development Roadmap](#11-development-roadmap)
12. [Pricing & Business Model](#12-pricing--business-model)
13. [Success Metrics](#13-success-metrics)

---

## 1. Executive Summary

### 1.1 Product Vision

**"The fastest way to analyze Excel/CSV files without being a data scientist"**

MagiXcel democratizes data analysis by combining:
- **Speed**: DuckDB-powered queries in milliseconds
- **Simplicity**: No SQL knowledge required
- **Scale**: Handle files up to 1GB seamlessly
- **Intelligence**: AI-powered insights and report generation

### 1.2 Core Value Proposition

#### For Banking/Finance Analysts:
- ✅ Analyze 500k+ transaction rows in seconds
- ✅ Cross-sheet reconciliation without VLOOKUP nightmares
- ✅ Auto-updating HTML reports for stakeholders
- ✅ AI-generated PowerPoint presentations
- ✅ Audit trail and compliance-ready

#### For All Users:
- ✅ Upload Excel/CSV up to 1GB
- ✅ Real-time filtering (<100ms response)
- ✅ Live auto-updating reports
- ✅ Google Drive integration
- ✅ Cross-file joins and analysis
- ✅ Export to multiple formats (Excel, CSV, JSON, Parquet, PPT)

### 1.3 Target Market

**Primary:** Banking & Finance analysts (€50M TAM)  
**Secondary:** E-commerce, HR, Marketing analysts  
**Tertiary:** Anyone frustrated with Excel performance

### 1.4 Key Differentiators

| Feature | MagiXcel | Excel | Power BI | Tableau |
|---------|----------|-------|----------|---------|
| **File Size** | 1GB+ | ~100MB | Requires DB | Requires DB |
| **Query Speed** | <100ms | Slow | Medium | Medium |
| **Setup Time** | 0 min | 0 min | Hours | Hours |
| **Learning Curve** | 5 min | Varies | Weeks | Weeks |
| **Price/User** | €69/mo | Included | €10-20/mo | €70/mo |
| **Cross-File Joins** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **AI Insights** | ✅ Yes | Limited | ❌ No | ❌ No |
| **Live Reports** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |

**Unique Selling Point:** DuckDB technology provides SQL-database performance in a simple web interface, without database setup.

---

## 2. Technical Architecture

### 2.1 Technology Stack

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  Language: TypeScript 5+ (strict mode)
  UI Library: 
    - Tailwind CSS 3.4
    - shadcn/ui (Radix UI primitives)
  State Management: Zustand 4.x
  Data Tables: TanStack Table v8
  Charts: Recharts 2.x
  Forms: React Hook Form + Zod validation
  
Backend:
  Runtime: Node.js 20+ LTS
  API: Next.js 14 API Routes (App Router)
  Edge Functions: Vercel Edge Runtime (where applicable)
  
Database & Analytics:
  Metadata DB: Supabase (PostgreSQL 15+)
  Analytics Engine: DuckDB 0.9.x
    - Server: duckdb npm package
    - Client (Phase 2): @duckdb/duckdb-wasm
  Query Builder: Custom SQL generator
  
File Storage:
  Primary: Cloudflare R2 (S3-compatible)
  Structure:
    - /files/{sessionId}/original.{ext}
    - /files/{sessionId}/data.parquet
    - /exports/{sessionId}/{timestamp}.{format}
  
Caching:
  KV Store: Vercel KV (Redis)
  TTL Strategy:
    - Query results: 1 hour
    - Session metadata: 24 hours
    - User preferences: 7 days
  
AI/ML:
  Gateway: Vercel AI SDK 3.x
  Provider: Mistral AI via OpenRouter
  Models:
    - ministral-3b: €0.04/M tokens (basic)
    - deepseek-r1-distill-llama-70b: €0.07/M tokens (advanced)
  
Authentication:
  Provider: Supabase Auth
  Methods: Email/Password, Google OAuth, SSO (Enterprise)
  
DevOps:
  Hosting: Vercel
  CDN: Cloudflare
  Monitoring: Sentry + Vercel Analytics
  Logs: Axiom
```

---

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Browser  │  │  Mobile  │  │ Desktop  │             │
│  │ (React)  │  │  (PWA)   │  │ (Future) │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼──────────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │ HTTPS
┌─────────────────────▼──────────────────────────────────┐
│              API LAYER (Next.js)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Upload  │  │ Filter  │  │ Export  │                │
│  │ Routes  │  │ Routes  │  │ Routes  │                │
│  └────┬────┘  └────┬────┘  └────┬────┘                │
└───────┼────────────┼─────────────┼─────────────────────┘
        │            │             │
┌───────┼────────────┼─────────────┼─────────────────────┐
│       │    DATA LAYER            │                      │
│  ┌────▼─────┐  ┌──▼──────┐  ┌───▼──────┐             │
│  │Supabase  │  │ DuckDB  │  │    R2    │             │
│  │   (PG)   │  │ Engine  │  │ Storage  │             │
│  ├──────────┤  ├─────────┤  ├──────────┤             │
│  │ Users    │◄─┤ Query   │◄─┤ Files    │             │
│  │ Sessions │  │ Execute │  │ Parquet  │             │
│  │Workspace │  │ Stream  │  │ Exports  │             │
│  └──────────┘  └─────────┘  └──────────┘             │
└──────────────────────────────────────────────────────────┘
```

---

### 2.3 Data Flow: File Upload & Processing

```
UPLOAD FLOW
═══════════

1. User selects file.xlsx (100MB)
   │
   ▼
2. Client validates (type, size)
   │
   ▼
3. POST /api/upload with FormData
   │
   ▼
4. API Route receives file
   │
   ├─► Generate sessionId (nanoid)
   │
   ├─► Security scan (file type validation)
   │
   ├─► Upload original to R2
   │   └─► Path: /files/{sessionId}/original.xlsx
   │
   ├─► DuckDB Processing:
   │   │
   │   ├─► Read Excel file
   │   │   const db = new duckdb.Database(':memory:');
   │   │   CREATE TABLE data AS 
   │   │   SELECT * FROM read_excel('file.xlsx');
   │   │
   │   ├─► Detect sheets
   │   │   SELECT DISTINCT sheet_name FROM data;
   │   │
   │   ├─► Extract metadata
   │   │   - Column names & types
   │   │   - Row counts per sheet
   │   │   - Data statistics
   │   │
   │   └─► Convert to Parquet
   │       COPY data TO 'output.parquet';
   │
   ├─► Upload Parquet to R2
   │   └─► Path: /files/{sessionId}/data.parquet
   │
   ├─► Save metadata to Supabase
   │   INSERT INTO sessions (
   │     id, workspace_id, name,
   │     r2_path_original, r2_path_parquet,
   │     metadata (sheets, columns, rowCounts)
   │   )
   │
   └─► Return to client:
       {
         sessionId,
         metadata: { sheets, columns, preview },
         redirectUrl: /workspace/{wid}/session/{sid}
       }
```

---

### 2.4 Data Flow: Filter Application

```
FILTER FLOW (Real-time)
════════════════════════

1. User modifies filter in UI
   │
   ▼
2. FilterBuilder generates FilterConfig
   {
     filters: [
       { column: "amount", operator: "gt", value: 1000 },
       { column: "region", operator: "in", value: ["EU", "US"] }
     ],
     combinator: "AND",
     globalSearch: "apple",
     sheetName: "Sales_Q1",
     pagination: { page: 1, pageSize: 100 }
   }
   │
   ▼
3. Debounced POST /api/filter
   │
   ▼
4. API Route processing:
   │
   ├─► Load session metadata from Supabase
   │
   ├─► Check cache (Vercel KV)
   │   Key: hash(sessionId + filterConfig)
   │   └─► HIT: Return cached results
   │   └─► MISS: Continue to query
   │
   ├─► Build SQL from FilterConfig:
   │   
   │   SELECT *
   │   FROM read_parquet('https://r2.../data.parquet')
   │   WHERE 1=1
   │     AND sheet = 'Sales_Q1'
   │     AND amount > 1000
   │     AND region IN ('EU', 'US')
   │     AND (
   │       CAST(amount AS VARCHAR) LIKE '%apple%'
   │       OR CAST(region AS VARCHAR) LIKE '%apple%'
   │       OR CAST(date AS VARCHAR) LIKE '%apple%'
   │     )
   │   ORDER BY amount DESC
   │   LIMIT 100 OFFSET 0;
   │   
   │   -- Also get total count:
   │   SELECT COUNT(*) FROM (...) AS filtered;
   │
   ├─► DuckDB executes query
   │   - Reads from R2 (streaming, columnar)
   │   - Filters in-memory (super fast!)
   │   - Returns results in ~50-200ms
   │
   ├─► Cache results (1 hour TTL)
   │
   └─► Return to client:
       {
         success: true,
         data: [...], // 100 rows
         totalRows: 50000,
         filteredRows: 2341,
         executionTime: 87, // ms
         page: 1,
         totalPages: 24
       }
```

**Key Performance Optimizations:**
- DuckDB reads Parquet in columnar format (only needed columns)
- Streaming from R2 (no full download)
- Query plan optimization by DuckDB
- Result caching prevents duplicate work
- Pagination limits data transfer

---

### 2.5 Data Flow: Cross-File Joins

```
CROSS-FILE JOIN FLOW
════════════════════

Use Case: Join sales.csv with customers.xlsx

1. User uploads both files
   │
   ├─► Session 1: sales.csv → /files/abc123/data.parquet
   └─► Session 2: customers.xlsx → /files/def456/data.parquet
   │
   ▼
2. User navigates to "Analysis" tab
   │
   ▼
3. Selects "Join Files" feature
   │
   ├─► Choose file 1: sales.csv (session abc123)
   ├─► Choose file 2: customers.xlsx (session def456)
   ├─► Select join type: LEFT JOIN
   ├─► Select join keys: sales.customer_id = customers.id
   │
   ▼
4. POST /api/analysis/join
   {
     session1: "abc123",
     session2: "def456",
     joinType: "LEFT",
     on: { left: "customer_id", right: "id" }
   }
   │
   ▼
5. API executes DuckDB query:
   
   SELECT 
     s.*,
     c.name as customer_name,
     c.email as customer_email
   FROM read_parquet('https://r2.../abc123/data.parquet') s
   LEFT JOIN read_parquet('https://r2.../def456/data.parquet') c
     ON s.customer_id = c.id;
   │
   ├─► DuckDB streams both files from R2
   ├─► Performs join in-memory
   ├─► Returns results
   │
   ▼
6. Option to save as new session:
   │
   ├─► User clicks "Save as New Dataset"
   │
   ├─► DuckDB exports to Parquet
   │   COPY (SELECT ...) TO 'joined.parquet';
   │
   ├─► Upload to R2: /files/ghi789/data.parquet
   │
   └─► Create new session in Supabase
       └─► User can now filter/analyze this joined dataset
```

**Why This Is Powerful:**
- Impossible in Excel without manual VLOOKUP
- Power BI/Tableau require database setup
- MagiXcel does it in-browser-speed with zero config

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 Core Tables

#### 3.1.1 users (managed by Supabase Auth)
```sql
-- Extended user metadata
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  full_name TEXT,
  company TEXT,
  role TEXT,
  
  -- Subscription
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'business', 'enterprise')),
  stripe_customer_id TEXT,
  subscription_status TEXT,
  subscription_end_date TIMESTAMPTZ,
  
  -- Usage tracking
  monthly_ai_credits_used INTEGER DEFAULT 0,
  monthly_ai_credits_limit INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10GB
  
  -- Preferences
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_plan ON user_profiles(plan);
CREATE INDEX idx_user_profiles_stripe ON user_profiles(stripe_customer_id);
```

---

#### 3.1.2 workspaces
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_default_workspace 
    UNIQUE(user_id, is_default) 
    WHERE is_default = true
);

CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_workspaces_created ON workspaces(created_at DESC);
```

---

#### 3.1.3 sessions
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Relationships
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File Information
  name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('xlsx', 'xls', 'csv')),
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 for deduplication
  
  -- R2 Storage Paths
  r2_path_original TEXT NOT NULL, -- /files/{id}/original.xlsx
  r2_path_parquet TEXT NOT NULL,  -- /files/{id}/data.parquet
  
  -- Data Metadata (flexible JSONB)
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
          {"name": "amount", "type": "decimal"},
          {"name": "region", "type": "varchar"}
        ]
      },
      {
        "name": "Q2_Sales",
        "rowCount": 12000,
        "columnCount": 15,
        "columns": [...]
      }
    ],
    "totalRows": 37000,
    "totalColumns": 15,
    "parquetSize": 2500000,
    "compressionRatio": 0.42,
    "processingTime": 3421
  }
  */
  
  -- Active Filters (per-sheet)
  active_filters JSONB,
  /* Example structure:
  {
    "Q1_Sales": {
      "filters": [
        {
          "id": "f1",
          "column": "amount",
          "operator": "greaterThan",
          "value": 1000
        },
        {
          "id": "f2",
          "column": "region",
          "operator": "in",
          "value": ["EU", "US"]
        }
      ],
      "combinator": "AND",
      "globalSearch": "",
      "appliedAt": "2024-01-15T10:30:00Z"
    },
    "Q2_Sales": {
      "filters": [...],
      "combinator": "OR",
      "appliedAt": "2024-01-15T10:35:00Z"
    }
  }
  */
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_workspace ON sessions(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_sessions_hash ON sessions(file_hash);
CREATE INDEX idx_sessions_last_accessed ON sessions(last_accessed_at DESC);

-- GIN index for JSONB queries
CREATE INDEX idx_sessions_metadata ON sessions USING GIN (metadata);
CREATE INDEX idx_sessions_filters ON sessions USING GIN (active_filters);
```

---

#### 3.1.4 filter_presets
```sql
CREATE TABLE filter_presets (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  
  -- Filter Configuration
  filter_config JSONB NOT NULL,
  /* Example structure:
  {
    "filters": [
      {
        "column": "amount",
        "operator": "greaterThan",
        "value": 1000
      },
      {
        "column": "status",
        "operator": "equals",
        "value": "Active"
      }
    ],
    "combinator": "AND"
  }
  */
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name)
);

CREATE INDEX idx_presets_user ON filter_presets(user_id);
CREATE INDEX idx_presets_category ON filter_presets(category);
CREATE INDEX idx_presets_usage ON filter_presets(use_count DESC);
```

---

#### 3.1.5 reports
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Relationships
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Report Configuration
  config JSONB NOT NULL,
  /* Example structure:
  {
    "type": "html", // or "ppt"
    "sheets": ["Q1_Sales", "Q2_Sales"],
    "filters": {...},
    "charts": [
      {
        "type": "bar",
        "dataSource": "Q1_Sales",
        "xAxis": "region",
        "yAxis": "amount",
        "aggregation": "sum"
      }
    ],
    "refreshSchedule": "daily", // or "weekly", "manual"
    "lastRefreshed": "2024-01-15T10:30:00Z"
  }
  */
  
  -- Report Output
  r2_path_html TEXT, -- /reports/{id}/index.html
  r2_path_ppt TEXT,  -- /reports/{id}/report.pptx
  public_url TEXT,   -- Shareable link
  is_public BOOLEAN DEFAULT false,
  
  -- Settings
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval TEXT, -- 'hourly', 'daily', 'weekly'
  
  -- AI Features
  ai_insights JSONB,
  ai_credits_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_session ON reports(session_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_public ON reports(is_public) WHERE is_public = true;
CREATE INDEX idx_reports_refresh ON reports(last_refreshed_at) 
  WHERE auto_refresh = true;
```

---

#### 3.1.6 exports
```sql
CREATE TABLE exports (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Relationships
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Export Details
  format TEXT NOT NULL CHECK(format IN ('csv', 'xlsx', 'json', 'parquet', 'ppt')),
  r2_path TEXT NOT NULL,
  file_size BIGINT,
  row_count INTEGER,
  
  -- Filter State (what was exported)
  filter_config JSONB,
  
  -- Download tracking
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- Auto-delete after X days
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exports_session ON exports(session_id);
CREATE INDEX idx_exports_user ON exports(user_id);
CREATE INDEX idx_exports_expires ON exports(expires_at);
```

---

#### 3.1.7 ai_usage
```sql
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  
  -- Usage Details
  feature TEXT NOT NULL, -- 'ppt_generation', 'nl_to_sql', 'anomaly_detection'
  model TEXT NOT NULL,   -- 'ministral-3b', 'deepseek-r1'
  
  -- Tokens & Cost
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  
  -- Request/Response
  prompt_hash TEXT, -- For deduplication
  execution_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_feature ON ai_usage(feature);
```

---

#### 3.1.8 audit_logs
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Who & What
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'session.create', 'filter.apply', 'export.download'
  resource_type TEXT,   -- 'session', 'workspace', 'report'
  resource_id TEXT,
  
  -- Details
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

---

### 3.2 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces: Users can only access their own workspaces
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- Sessions: Users can only access sessions in their workspaces
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = sessions.workspace_id
      AND workspaces.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Filter Presets: Users can only access their own presets
CREATE POLICY "Users can view own presets"
  ON filter_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own presets"
  ON filter_presets FOR ALL
  USING (auth.uid() = user_id);

-- Reports: Users can view their own reports + public reports
CREATE POLICY "Users can view own and public reports"
  ON reports FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
  );

CREATE POLICY "Users can manage own reports"
  ON reports FOR ALL
  USING (auth.uid() = user_id);
```

---

### 3.3 Database Functions & Triggers

```sql
-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update last_accessed_at on session view
CREATE OR REPLACE FUNCTION update_session_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions
  SET last_accessed_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment storage usage on file upload
CREATE OR REPLACE FUNCTION increment_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET storage_used_bytes = storage_used_bytes + NEW.file_size
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_storage_on_upload
  AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION increment_user_storage();

-- Function: Decrement storage usage on file delete
CREATE OR REPLACE FUNCTION decrement_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET storage_used_bytes = storage_used_bytes - OLD.file_size
  WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_storage_on_delete
  AFTER DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION decrement_user_storage();

-- Function: Reset monthly AI credits (call via cron)
CREATE OR REPLACE FUNCTION reset_monthly_ai_credits()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET monthly_ai_credits_used = 0;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. API Specification

### 4.1 API Conventions

**Base URL:** `https://magixcel.com/api`

**Authentication:** Bearer token (Supabase JWT)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:**
```typescript
// Success
{
  success: true,
  data: {...},
  meta?: {
    page: 1,
    totalPages: 10,
    totalResults: 237
  }
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "File size exceeds limit",
    details: {...}
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_ERROR` - Auth required/failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `STORAGE_LIMIT_EXCEEDED` - Storage quota exceeded
- `PROCESSING_ERROR` - File processing failed
- `AI_CREDITS_EXCEEDED` - AI quota exceeded

---

### 4.2 Upload & Processing

#### POST /api/upload
Upload and process Excel/CSV file.

**Request:**
```typescript
Content-Type: multipart/form-data

{
  file: File, // Required: Excel or CSV file
  workspaceId: string, // Required
  sessionName?: string // Optional, defaults to filename
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    sessionId: string,
    workspaceId: string,
    name: string,
    metadata: {
      sheets: [
        {
          name: "Q1_Sales",
          rowCount: 10000,
          columnCount: 15,
          columns: [
            { name: "id", type: "integer" },
            { name: "date", type: "date" },
            { name: "amount", type: "decimal" }
          ]
        }
      ],
      totalRows: 10000,
      fileSize: 5242880,
      processingTime: 3421
    },
    preview: [...] // First 10 rows
  }
}
```

**Errors:**
- `400` - Invalid file type or size
- `402` - Storage limit exceeded (upgrade required)
- `500` - Processing failed

---

#### GET /api/session/:id
Get session metadata and preview.

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    workspaceId: string,
    originalFileName: string,
    fileType: "xlsx" | "xls" | "csv",
    fileSize: number,
    metadata: {
      sheets: [...],
      totalRows: number,
      totalColumns: number
    },
    activeFilters: {...},
    createdAt: string,
    updatedAt: string,
    lastAccessedAt: string
  }
}
```

---

#### DELETE /api/session/:id
Delete session and associated files.

**Response:**
```typescript
{
  success: true,
  message: "Session deleted successfully"
}
```

---

### 4.3 Filtering & Querying

#### POST /api/filter
Apply filters to session data.

**Request:**
```typescript
{
  sessionId: string,
  sheetName?: string, // Optional, defaults to first sheet
  filters: [
    {
      id: string,
      column: string,
      operator: "equals" | "notEquals" | "contains" | "notContains" |
                "greaterThan" | "lessThan" | "greaterThanOrEqual" | 
                "lessThanOrEqual" | "between" | "in" | "notIn" |
                "isNull" | "isNotNull" | "startsWith" | "endsWith",
      value: any,
      value2?: any // For "between" operator
    }
  ],
  combinator: "AND" | "OR",
  globalSearch?: string,
  sortBy?: {
    column: string,
    direction: "asc" | "desc"
  },
  pagination: {
    page: number,
    pageSize: number
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    rows: [...], // Paginated filtered rows
    totalRows: number, // Total before filtering
    filteredRows: number, // After filtering
    executionTime: number, // milliseconds
    page: number,
    pageSize: number,
    totalPages: number
  }
}
```

---

#### POST /api/filter/save
Save current filters as preset.

**Request:**
```typescript
{
  name: string,
  description?: string,
  category?: string,
  filterConfig: {
    filters: [...],
    combinator: "AND" | "OR"
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    description: string,
    category: string,
    filterConfig: {...}
  }
}
```

---

#### GET /api/filter/presets
List user's filter presets.

**Query Parameters:**
- `category` (optional): Filter by category

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string,
      category: string,
      filterConfig: {...},
      useCount: number,
      createdAt: string,
      updatedAt: string
    }
  ]
}
```

---

### 4.4 Analysis & Insights

#### POST /api/analysis/stats
Get statistical summary of data.

**Request:**
```typescript
{
  sessionId: string,
  sheetName?: string,
  columns?: string[], // Optional, defaults to all numeric columns
  filters?: {...} // Optional, analyze filtered data
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    numeric: {
      "amount": {
        min: 10.50,
        max: 99999.99,
        mean: 5432.10,
        median: 3210.00,
        stddev: 2345.67,
        sum: 54321000.00,
        count: 10000,
        nullCount: 23
      }
    },
    categorical: {
      "region": {
        uniqueValues: 5,
        topValues: [
          { value: "US", count: 4321 },
          { value: "EU", count: 3210 },
          { value: "APAC", count: 2100 }
        ],
        nullCount: 12
      }
    }
  }
}
```

---

#### POST /api/analysis/join
Join two sessions (cross-file analysis).

**Request:**
```typescript
{
  leftSessionId: string,
  leftSheetName?: string,
  rightSessionId: string,
  rightSheetName?: string,
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL",
  on: {
    left: string, // column name
    right: string // column name
  },
  select?: string[], // Optional columns to include
  saveAsNewSession?: boolean
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    rows: [...], // First 100 joined rows
    totalRows: number,
    newSessionId?: string // If saveAsNewSession = true
  }
}
```

---

#### POST /api/analysis/nl-query
Natural language to SQL query.

**Request:**
```typescript
{
  sessionId: string,
  query: string, // "Show me transactions over $10k from EU customers"
  sheetName?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    sql: string, // Generated SQL
    results: [...],
    explanation: string, // AI explanation of what it did
    aiCreditsUsed: number
  }
}
```

---

### 4.5 Export & Reports

#### POST /api/export
Export filtered data.

**Request:**
```typescript
{
  sessionId: string,
  format: "csv" | "xlsx" | "json" | "parquet",
  filters?: {...}, // Optional, exports filtered data
  sheets?: string[], // For multi-sheet export
  includeHeaders?: boolean,
  delimiter?: string // For CSV only
}
```

**Response:**
```typescript
// File download with headers:
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="export-2024-01-15.xlsx"

// Or JSON response with download URL:
{
  success: true,
  data: {
    downloadUrl: string,
    fileSize: number,
    expiresAt: string // 24 hours
  }
}
```

---

#### POST /api/export/ppt
Generate PowerPoint presentation.

**Request:**
```typescript
{
  sessionId: string,
  type: "basic" | "smart", // basic = no AI, smart = AI insights
  filters?: {...},
  sheets?: string[],
  options?: {
    includeCharts: boolean,
    includeStatistics: boolean,
    includeRecommendations: boolean // smart only
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    downloadUrl: string,
    aiCreditsUsed: number, // For smart PPT
    slideCount: number
  }
}
```

---

#### POST /api/reports
Create live HTML report.

**Request:**
```typescript
{
  sessionId: string,
  name: string,
  description?: string,
  config: {
    sheets: string[],
    filters: {...},
    charts: [
      {
        type: "bar" | "line" | "pie" | "scatter",
        dataSource: string, // sheet name
        xAxis: string,
        yAxis: string,
        aggregation: "sum" | "avg" | "count" | "min" | "max"
      }
    ],
    refreshInterval: "manual" | "hourly" | "daily" | "weekly"
  },
  isPublic?: boolean
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    reportId: string,
    publicUrl: string, // If isPublic = true
    htmlPath: string
  }
}
```

---

#### GET /api/reports/:id
View live report.

**Response:**
- HTML page with embedded data and charts
- Auto-refreshes based on config
- Interactive filters

---

### 4.6 Workspaces

#### GET /api/workspaces
List user's workspaces.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string,
      color: string,
      icon: string,
      isDefault: boolean,
      sessionCount: number,
      createdAt: string
    }
  ]
}
```

---

#### POST /api/workspaces
Create new workspace.

**Request:**
```typescript
{
  name: string,
  description?: string,
  color?: string,
  icon?: string
}
```

---

#### PUT /api/workspaces/:id
Update workspace.

---

#### DELETE /api/workspaces/:id
Delete workspace and all sessions (except default).

---

### 4.7 User & Subscription

#### GET /api/user/profile
Get user profile and usage.

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    email: string,
    fullName: string,
    plan: "free" | "pro" | "business" | "enterprise",
    usage: {
      monthlyAiCreditsUsed: number,
      monthlyAiCreditsLimit: number,
      storageUsedBytes: number,
      storageLimitBytes: number,
      sessionsCount: number
    },
    subscription: {
      status: "active" | "canceled" | "past_due",
      currentPeriodEnd: string
    }
  }
}
```

---

#### POST /api/user/upgrade
Initiate subscription upgrade.

**Request:**
```typescript
{
  plan: "pro" | "business" | "enterprise"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    checkoutUrl: string // Stripe checkout session
  }
}
```

---

### 4.8 Rate Limiting

All endpoints are rate-limited:

| Endpoint | Free | Pro | Business | Enterprise |
|----------|------|-----|----------|------------|
| **/api/upload** | 5/hour | 50/hour | 200/hour | Unlimited |
| **/api/filter** | 100/hour | 1000/hour | 10000/hour | Unlimited |
| **/api/export** | 10/day | 100/day | 1000/day | Unlimited |
| **/api/analysis/nl-query** | 10/day | 100/day | 1000/day | Unlimited |
| **/api/export/ppt** (smart) | 0 | 50/month | 500/month | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1642348800
```

**Error Response (429):**
```typescript
{
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Try again in 42 minutes.",
    retryAfter: 2520 // seconds
  }
}
```

---

## 5. Frontend Architecture

### 5.1 Directory Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx                    # Workspace grid
│   │
│   ├── workspace/
│   │   └── [workspaceId]/
│   │       ├── page.tsx            # Sessions list + upload
│   │       └── session/
│   │           └── [sessionId]/
│   │               └── page.tsx    # Data viewer
│   │
│   ├── reports/
│   │   ├── page.tsx                # Reports list
│   │   └── [reportId]/
│   │       └── page.tsx            # Report viewer
│   │
│   └── settings/
│       ├── page.tsx                # Profile
│       ├── billing/
│       │   └── page.tsx
│       └── usage/
│           └── page.tsx
│
├── api/                            # API routes (see section 4)
│   ├── upload/
│   ├── filter/
│   ├── export/
│   ├── analysis/
│   └── ...
│
├── layout.tsx                      # Root layout
├── page.tsx                        # Landing page
└── globals.css

components/
├── ui/                             # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── table.tsx
│   └── ...
│
├── upload/
│   ├── FileUploader.tsx
│   ├── UploadProgress.tsx
│   └── FileValidator.tsx
│
├── workspace/
│   ├── WorkspaceGrid.tsx
│   ├── WorkspaceCard.tsx
│   ├── CreateWorkspaceModal.tsx
│   └── EditWorkspaceModal.tsx
│
├── session/
│   ├── SessionList.tsx
│   ├── SessionCard.tsx
│   ├── DataTable.tsx               # Main data table
│   ├── SheetTabs.tsx               # Multi-sheet navigation
│   └── SessionHeader.tsx
│
├── filters/
│   ├── FilterBuilder.tsx           # Main filter UI
│   ├── FilterRow.tsx               # Single filter
│   ├── FilterGroup.tsx             # Grouped filters
│   ├── FilterPresets.tsx           # Save/load presets
│   ├── GlobalSearch.tsx
│   └── FilterConfig.tsx            # Type definitions
│
├── charts/
│   ├── BarChart.tsx
│   ├── LineChart.tsx
│   ├── PieChart.tsx
│   └── ChartBuilder.tsx
│
├── export/
│   ├── ExportDialog.tsx
│   ├── PPTGenerator.tsx
│   └── FormatSelector.tsx
│
├── reports/
│   ├── ReportBuilder.tsx
│   ├── ReportViewer.tsx
│   └── LiveReportEmbed.tsx
│
└── layout/
    ├── Navbar.tsx
    ├── Sidebar.tsx
    └── Footer.tsx

lib/
├── duckdb/
│   ├── client.ts                   # DuckDB client wrapper
│   ├── query-builder.ts            # FilterConfig → SQL
│   └── types.ts
│
├── supabase/
│   ├── client.ts                   # Supabase client
│   ├── auth.ts                     # Auth helpers
│   └── queries.ts                  # Database queries
│
├── r2/
│   ├── client.ts                   # R2 upload/download
│   └── url-signer.ts               # Presigned URLs
│
├── processing/
│   ├── excel-processor.ts
│   ├── csv-processor.ts
│   ├── parquet-converter.ts
│   └── type-inference.ts
│
├── ai/
│   ├── nl-to-sql.ts                # Natural language query
│   ├── ppt-generator.ts            # AI PPT insights
│   ├── anomaly-detector.ts
│   └── cost-tracker.ts
│
├── utils/
│   ├── formatters.ts               # Date, number, currency
│   ├── validators.ts               # Input validation
│   ├── constants.ts
│   └── helpers.ts
│
└── hooks/
    ├── useDebounce.ts
    ├── useLocalStorage.ts
    ├── useUpload.ts
    ├── useFilter.ts
    └── useSession.ts

stores/
├── session-store.ts                # Current session state
├── filter-store.ts                 # Filter state (per-sheet)
├── data-store.ts                   # Data & pagination
├── ui-store.ts                     # UI state (modals, etc)
└── user-store.ts                   # User profile & preferences

types/
├── database.ts                     # Supabase types
├── filters.ts                      # Filter config types
├── data.ts                         # Data processing types
├── api.ts                          # API request/response types
└── index.ts                        # Re-exports
```

---

### 5.2 Key Components

#### 5.2.1 DataTable Component

**Location:** `components/session/DataTable.tsx`

**Purpose:** Main data visualization component with filtering, sorting, pagination.

**Features:**
- Virtual scrolling (TanStack Table)
- Column resizing
- Sort by column
- Inline cell editing (future)
- Export selection
- Keyboard navigation

**Props:**
```typescript
interface DataTableProps {
  sessionId: string;
  sheetName: string;
  data: any[];
  columns: ColumnDef[];
  totalRows: number;
  filteredRows: number;
  isLoading: boolean;
  onFilterChange: (config: FilterConfig) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
}
```

**State Management:**
- Uses `data-store` for data
- Uses `filter-store` for active filters
- Local state for UI (selected rows, etc)

---

#### 5.2.2 FilterBuilder Component

**Location:** `components/filters/FilterBuilder.tsx`

**Purpose:** Visual filter builder with live preview.

**Features:**
- Add/remove filters
- Nested filter groups (AND/OR)
- Global search across all columns
- Save/load presets
- Natural language input (AI)
- Filter validation
- Live row count preview

**Architecture:**
```typescript
<FilterBuilder>
  <GlobalSearch />
  
  <FilterPresets />
  
  <FilterGroup combinator="AND">
    <FilterRow 
      column="amount"
      operator="greaterThan"
      value={1000}
    />
    
    <FilterGroup combinator="OR">
      <FilterRow column="region" operator="equals" value="EU" />
      <FilterRow column="region" operator="equals" value="US" />
    </FilterGroup>
  </FilterGroup>
  
  <NaturalLanguageInput />
  
  <FilterActions>
    <Button>Apply</Button>
    <Button>Clear</Button>
    <Button>Save Preset</Button>
  </FilterActions>
</FilterBuilder>
```

---

#### 5.2.3 FileUploader Component

**Location:** `components/upload/FileUploader.tsx`

**Features:**
- Drag & drop
- File validation (type, size)
- Progress bar
- Multi-file upload queue (future)
- Error handling
- Preview before upload

**Upload Flow:**
```typescript
const handleUpload = async (file: File) => {
  // 1. Validate
  const validation = validateFile(file);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  // 2. Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', currentWorkspaceId);
  
  // 3. Upload with progress tracking
  const response = await uploadWithProgress('/api/upload', formData, {
    onProgress: (percent) => setUploadProgress(percent)
  });
  
  // 4. Handle response
  if (response.success) {
    router.push(`/workspace/${workspaceId}/session/${response.data.sessionId}`);
  }
};
```

---

#### 5.2.4 SheetTabs Component

**Location:** `components/session/SheetTabs.tsx`

**Purpose:** Excel-style sheet navigation for multi-sheet files.

**Features:**
- Click to switch sheets
- Active sheet indicator
- Filter badge per sheet (shows active filter count)
- Horizontal scroll for many sheets
- Sheet rename (future)

```typescript
<SheetTabs
  sheets={["Q1_Sales", "Q2_Sales", "Q3_Sales", "Q4_Sales"]}
  activeSheet="Q1_Sales"
  filterCounts={{
    "Q1_Sales": 3,
    "Q2_Sales": 0,
    "Q3_Sales": 1,
    "Q4_Sales": 2
  }}
  onSheetChange={(sheetName) => {
    // Load sheet data
    // Apply sheet-specific filters
    setActiveSheet(sheetName);
  }}
/>
```

---

### 5.3 State Management (Zustand)

#### session-store.ts
```typescript
interface SessionState {
  // Current session
  currentSessionId: string | null;
  currentSheetName: string | null;
  metadata: SessionMetadata | null;
  
  // Actions
  setSession: (sessionId: string, metadata: SessionMetadata) => void;
  setSheet: (sheetName: string) => void;
  clearSession: () => void;
}
```

---

#### filter-store.ts
```typescript
interface FilterState {
  // Per-sheet filters
  filtersBySheet: Record<string, SheetFilters>;
  
  // Current sheet
  currentSheet: string;
  
  // Actions
  setFilters: (sheetName: string, filters: Filter[]) => void;
  addFilter: (sheetName: string, filter: Filter) => void;
  updateFilter: (sheetName: string, filterId: string, updates: Partial<Filter>) => void;
  removeFilter: (sheetName: string, filterId: string) => void;
  setCombinator: (sheetName: string, combinator: 'AND' | 'OR') => void;
  setGlobalSearch: (sheetName: string, search: string) => void;
  clearFilters: (sheetName: string) => void;
  
  // Presets
  presets: FilterPreset[];
  loadPresets: () => Promise<void>;
  savePreset: (name: string, description: string, category: string) => Promise<void>;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => Promise<void>;
}

interface SheetFilters {
  filters: Filter[];
  combinator: 'AND' | 'OR';
  globalSearch: string;
  appliedAt?: string;
}

interface Filter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For "between"
}

type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'startsWith'
  | 'endsWith';
```

---

#### data-store.ts
```typescript
interface DataState {
  // Multi-sheet data
  dataBySheet: Record<string, SheetData>;
  
  // Current sheet
  currentSheet: string;
  
  // Loading state
  isLoading: boolean;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  
  // Sorting
  sortBy: {
    column: string;
    direction: 'asc' | 'desc';
  } | null;
  
  // Actions
  loadSheetData: (sheetName: string, sessionId: string) => Promise<void>;
  applyFilters: (filterConfig: FilterConfig) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSorting: (column: string, direction: 'asc' | 'desc') => void;
  clearSorting: () => void;
}

interface SheetData {
  columns: ColumnDef[];
  rows: any[];
  totalRows: number;
  filteredRows: number;
  lastUpdated: string;
}
```

---

### 5.4 Custom Hooks

#### useFilter Hook
```typescript
export function useFilter(sessionId: string, sheetName: string) {
  const { filtersBySheet, setFilters, addFilter, removeFilter } = useFilterStore();
  const { applyFilters } = useDataStore();
  
  const currentFilters = filtersBySheet[sheetName] || {
    filters: [],
    combinator: 'AND',
    globalSearch: ''
  };
  
  // Debounced apply
  const debouncedApply = useDebounce(async (config: FilterConfig) => {
    await applyFilters(config);
  }, 300);
  
  // Auto-apply on filter change
  useEffect(() => {
    debouncedApply({
      sessionId,
      sheetName,
      filters: currentFilters.filters,
      combinator: currentFilters.combinator,
      globalSearch: currentFilters.globalSearch
    });
  }, [currentFilters]);
  
  return {
    filters: currentFilters.filters,
    combinator: currentFilters.combinator,
    globalSearch: currentFilters.globalSearch,
    addFilter: (filter: Filter) => addFilter(sheetName, filter),
    removeFilter: (filterId: string) => removeFilter(sheetName, filterId),
    setGlobalSearch: (search: string) => setGlobalSearch(sheetName, search)
  };
}
```

---

#### useUpload Hook
```typescript
export function useUpload(workspaceId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const upload = async (file: File, sessionName?: string) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      if (sessionName) formData.append('sessionName', sessionName);
      
      const response = await uploadWithProgress('/api/upload', formData, {
        onProgress: setProgress
      });
      
      if (!response.success) {
        throw new Error(response.error.message);
      }
      
      return response.data;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  return { upload, isUploading, progress, error };
}
```

---

## 6. Data Processing Pipeline

### 6.1 File Processing Architecture

```
┌──────────────────────────────────────────────────────────┐
│ FILE PROCESSING PIPELINE                                  │
└──────────────────────────────────────────────────────────┘

INPUT: file.xlsx (100MB)
  │
  ▼
┌─────────────────────────────┐
│ 1. VALIDATION               │
├─────────────────────────────┤
│ • File type check           │
│ • Size limit (1GB)          │
│ • MIME type verification    │
│ • Malware scan (ClamAV)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 2. UPLOAD TO R2             │
├─────────────────────────────┤
│ • Stream to Cloudflare R2   │
│ • Path: /files/{id}/orig... │
│ • Generate presigned URL    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 3. DUCKDB PROCESSING        │
├─────────────────────────────┤
│ Step 3.1: Read Excel        │
│   const db = new duck...    │
│   CREATE TABLE data AS      │
│   SELECT * FROM read_ex...  │
│                             │
│ Step 3.2: Sheet Detection   │
│   SELECT DISTINCT sheet...  │
│                             │
│ Step 3.3: Type Inference    │
│   DESCRIBE data;            │
│                             │
│ Step 3.4: Metadata Extract  │
│   • Column names & types    │
│   • Row counts              │
│   • Statistics              │
│                             │
│ Step 3.5: Parquet Export    │
│   COPY data TO 'out.par...  │
│   (Compression: Snappy)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 4. UPLOAD PARQUET TO R2     │
├─────────────────────────────┤
│ • Path: /files/{id}/data... │
│ • Size reduction: ~60-70%   │
│ • Columnar format (fast!)   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 5. SAVE METADATA TO SUPABASE│
├─────────────────────────────┤
│ INSERT INTO sessions:       │
│ • id, name, workspace_id    │
│ • file paths (R2)           │
│ • metadata (JSONB)          │
│   - sheets                  │
│   - columns                 │
│   - row counts              │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 6. GENERATE PREVIEW         │
├─────────────────────────────┤
│ SELECT * FROM data          │
│ LIMIT 10;                   │
└─────────────┬───────────────┘
              │
              ▼
OUTPUT: { sessionId, metadata, preview }
```

---

### 6.2 DuckDB Query Builder

**Purpose:** Convert FilterConfig to optimized SQL.

**Location:** `lib/duckdb/query-builder.ts`

```typescript
export class DuckDBQueryBuilder {
  private sessionId: string;
  private sheetName: string;
  private parquetPath: string;
  
  constructor(sessionId: string, sheetName: string) {
    this.sessionId = sessionId;
    this.sheetName = sheetName;
    this.parquetPath = `https://r2.cloudflare.com/files/${sessionId}/data.parquet`;
  }
  
  /**
   * Build SQL query from FilterConfig
   */
  buildQuery(config: FilterConfig): string {
    const {
      filters,
      combinator,
      globalSearch,
      sortBy,
      pagination
    } = config;
    
    let sql = `SELECT * FROM read_parquet('${this.parquetPath}')`;
    
    // Add WHERE clause
    const conditions: string[] = [];
    
    // Sheet filter (for multi-sheet files)
    conditions.push(`sheet = '${this.sheetName}'`);
    
    // Specific filters
    if (filters.length > 0) {
      const filterSQL = this.buildFilterSQL(filters, combinator);
      conditions.push(`(${filterSQL})`);
    }
    
    // Global search
    if (globalSearch) {
      const searchSQL = this.buildGlobalSearchSQL(globalSearch);
      conditions.push(`(${searchSQL})`);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    if (sortBy) {
      sql += ` ORDER BY ${sortBy.column} ${sortBy.direction.toUpperCase()}`;
    }
    
    // Add pagination
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      sql += ` LIMIT ${pagination.pageSize} OFFSET ${offset}`;
    }
    
    return sql;
  }
  
  /**
   * Build filter conditions recursively
   */
  private buildFilterSQL(filters: Filter[], combinator: 'AND' | 'OR'): string {
    const conditions = filters.map(filter => {
      return this.buildSingleFilterSQL(filter);
    });
    
    return conditions.join(` ${combinator} `);
  }
  
  /**
   * Build single filter condition
   */
  private buildSingleFilterSQL(filter: Filter): string {
    const { column, operator, value, value2 } = filter;
    
    switch (operator) {
      case 'equals':
        return `${column} = ${this.escapeValue(value)}`;
      
      case 'notEquals':
        return `${column} != ${this.escapeValue(value)}`;
      
      case 'contains':
        return `LOWER(CAST(${column} AS VARCHAR)) LIKE LOWER('%${value}%')`;
      
      case 'notContains':
        return `LOWER(CAST(${column} AS VARCHAR)) NOT LIKE LOWER('%${value}%')`;
      
      case 'greaterThan':
        return `${column} > ${this.escapeValue(value)}`;
      
      case 'lessThan':
        return `${column} < ${this.escapeValue(value)}`;
      
      case 'greaterThanOrEqual':
        return `${column} >= ${this.escapeValue(value)}`;
      
      case 'lessThanOrEqual':
        return `${column} <= ${this.escapeValue(value)}`;
      
      case 'between':
        return `${column} BETWEEN ${this.escapeValue(value)} AND ${this.escapeValue(value2)}`;
      
      case 'in':
        const values = Array.isArray(value) ? value : [value];
        const escapedValues = values.map(v => this.escapeValue(v)).join(', ');
        return `${column} IN (${escapedValues})`;
      
      case 'notIn':
        const notValues = Array.isArray(value) ? value : [value];
        const escapedNotValues = notValues.map(v => this.escapeValue(v)).join(', ');
        return `${column} NOT IN (${escapedNotValues})`;
      
      case 'isNull':
        return `${column} IS NULL`;
      
      case 'isNotNull':
        return `${column} IS NOT NULL`;
      
      case 'startsWith':
        return `LOWER(CAST(${column} AS VARCHAR)) LIKE LOWER('${value}%')`;
      
      case 'endsWith':
        return `LOWER(CAST(${column} AS VARCHAR)) LIKE LOWER('%${value}')`;
      
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
  
  /**
   * Build global search across all columns
   */
  private buildGlobalSearchSQL(search: string): string {
    // Get all columns for this sheet from metadata
    const columns = this.getSheetColumns();
    
    const conditions = columns.map(col => {
      return `LOWER(CAST(${col} AS VARCHAR)) LIKE LOWER('%${search}%')`;
    });
    
    return conditions.join(' OR ');
  }
  
  /**
   * Escape value for SQL
   */
  private escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    
    throw new Error(`Cannot escape value of type: ${typeof value}`);
  }
  
  /**
   * Build count query (for pagination)
   */
  buildCountQuery(config: FilterConfig): string {
    const baseQuery = this.buildQuery({
      ...config,
      sortBy: null, // No sorting needed for count
      pagination: null // No pagination for count
    });
    
    return `SELECT COUNT(*) as total FROM (${baseQuery}) AS filtered`;
  }
  
  /**
   * Build statistics query
   */
  buildStatsQuery(columns: string[]): string {
    const numericStats = columns.map(col => `
      MIN(${col}) as ${col}_min,
      MAX(${col}) as ${col}_max,
      AVG(${col}) as ${col}_avg,
      STDDEV(${col}) as ${col}_stddev,
      SUM(${col}) as ${col}_sum
    `).join(',');
    
    return `
      SELECT
        COUNT(*) as total_rows,
        ${numericStats}
      FROM read_parquet('${this.parquetPath}')
      WHERE sheet = '${this.sheetName}'
    `;
  }
}
```

---

### 6.3 Performance Optimizations

#### 6.3.1 Parquet Advantages

**Why Parquet > CSV/Excel:**
- **Columnar Storage**: Read only needed columns (10-100x faster)
- **Compression**: 60-70% smaller files (Snappy compression)
- **Type Safety**: Preserves data types (no string→number conversion)
- **Predicate Pushdown**: DuckDB filters while reading (doesn't load filtered-out data)
- **Streaming**: Can query without loading entire file to memory

**Example:**
```typescript
// Original Excel: 100MB
// Parquet: 35MB (65% reduction)

// Query: SELECT region, amount FROM data WHERE amount > 1000
// With CSV: Load 100MB → Filter → Select columns
// With Parquet: Read only 'region' and 'amount' columns → Filter while reading
// Result: 50x faster, 10x less memory
```

---

#### 6.3.2 Caching Strategy

**3-Tier Cache:**

```
┌──────────────────────────────────────────────────────┐
│ TIER 1: Browser Cache (React Query)                  │
├──────────────────────────────────────────────────────┤
│ • Duration: 5 minutes                                │
│ • Scope: Current session data, metadata             │
│ • Invalidation: On filter change, explicit refresh  │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ TIER 2: Redis Cache (Vercel KV)                      │
├──────────────────────────────────────────────────────┤
│ • Duration: 1 hour                                   │
│ • Key: hash(sessionId + filterConfig)               │
│ • Stores: Query results (paginated)                 │
│ • Invalidation: TTL, session update                 │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│ TIER 3: R2 Storage (Parquet Files)                   │
├──────────────────────────────────────────────────────┤
│ • Duration: Permanent (until deleted)                │
│ • CDN cached: Yes (Cloudflare)                      │
│ • Hot/Cold storage: Auto-tiering                    │
└──────────────────────────────────────────────────────┘
```

**Cache Key Generation:**
```typescript
function generateCacheKey(config: FilterConfig): string {
  const normalized = {
    sessionId: config.sessionId,
    sheetName: config.sheetName,
    filters: sortFilters(config.filters), // Consistent order
    combinator: config.combinator,
    globalSearch: config.globalSearch,
    sortBy: config.sortBy,
    pagination: config.pagination
  };
  
  return createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}
```

---

#### 6.3.3 Query Optimization

**DuckDB Automatic Optimizations:**
- **Column Pruning**: Only reads needed columns from Parquet
- **Predicate Pushdown**: Applies filters while reading
- **Join Reordering**: Optimizes join order
- **Parallel Execution**: Uses all CPU cores
- **Adaptive Query Execution**: Adjusts plan based on data distribution

**Manual Optimizations:**
```typescript
// ✅ GOOD: Filter early, select late
SELECT id, name, amount
FROM read_parquet('data.parquet')
WHERE amount > 1000 AND region = 'EU'
LIMIT 100;

// ❌ BAD: Select all, filter late
SELECT *
FROM (
  SELECT * FROM read_parquet('data.parquet')
  LIMIT 10000
)
WHERE amount > 1000;
```

---

## 7. Feature Specifications

### 7.1 Live HTML Reports

**Concept:** Auto-updating dashboard that refreshes when source data changes.

**Architecture:**
```
User creates report → HTML generated → Hosted on R2 → Public URL
                                              ↓
                                      Source data changes
                                              ↓
                                      Webhook triggers
                                              ↓
                                      Report regenerates
                                              ↓
                                      Viewers see new data
```

**Implementation:**

```typescript
// lib/reports/generator.ts
export async function generateLiveReport(config: ReportConfig) {
  const { sessionId, sheets, filters, charts, refreshInterval } = config;
  
  // 1. Generate HTML with embedded Chart.js
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.name}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          /* Tailwind CSS from CDN */
        </style>
      </head>
      <body>
        <div id="app">
          <header>
            <h1>${config.name}</h1>
            <p>Last updated: <span id="last-updated"></span></p>
            <button onclick="refresh()">Refresh</button>
          </header>
          
          <div class="filters">
            <!-- Interactive filters -->
          </div>
          
          <div class="charts">
            <!-- Chart.js canvases -->
          </div>
          
          <div class="data-table">
            <!-- Filtered data table -->
          </div>
        </div>
        
        <script>
          // Data fetching logic
          async function fetchData() {
            const response = await fetch('/api/reports/${reportId}/data');
            const data = await response.json();
            renderCharts(data);
            renderTable(data);
            document.getElementById('last-updated').textContent = new Date().toLocaleString();
          }
          
          // Auto-refresh
          setInterval(fetchData, ${refreshInterval});
          
          // Initial load
          fetchData();
        </script>
      </body>
    </html>
  `;
  
  // 2. Upload HTML to R2
  const reportPath = `/reports/${reportId}/index.html`;
  await r2.upload(reportPath, html, { contentType: 'text/html' });
  
  // 3. Generate public URL
  const publicUrl = `https://reports.magixcel.com/${reportId}`;
  
  // 4. Save to database
  await db.reports.create({
    id: reportId,
    sessionId,
    name: config.name,
    config,
    r2_path_html: reportPath,
    public_url: publicUrl,
    auto_refresh: true,
    refresh_interval: refreshInterval
  });
  
  return { reportId, publicUrl };
}
```

**Features:**
- ✅ Embeddable (iframe)
- ✅ Responsive design
- ✅ Interactive filters
- ✅ Auto-refresh (configurable interval)
- ✅ Export buttons (CSV, PDF)
- ✅ Shareable link
- ✅ Password protection (optional)
- ✅ Custom branding (Business+ plans)

---

### 7.2 AI-Powered PPT Generation

**Two Modes:**

#### Mode 1: Basic PPT (No AI)
- Template-based
- Auto-generated charts
- Statistics summary
- Fast (<2 seconds)
- Free for all users

#### Mode 2: Smart PPT (AI-Enhanced)
- All Basic features +
- Executive summary (AI-written)
- Key insights (AI-identified)
- Trend analysis
- Anomaly detection
- Recommendations
- €0.02-0.05 per generation

**Implementation:**

```typescript
// lib/ppt/smart-generator.ts
export async function generateSmartPPT(
  sessionId: string,
  filters: FilterConfig,
  userPlan: string
) {
  // 1. Get filtered data
  const data = await fetchFilteredData(sessionId, filters);
  
  // 2. Basic PPT structure
  const ppt = new pptxgen();
  
  // Slide 1: Title
  addTitleSlide(ppt, sessionId);
  
  // Slide 2: Executive Summary (AI)
  const summary = await generateAISummary(data);
  addTextSlide(ppt, 'Executive Summary', summary);
  
  // Slide 3: Data Table
  addDataTableSlide(ppt, data.slice(0, 20));
  
  // Slide 4-6: Charts
  addChartSlides(ppt, data);
  
  // Slide 7: Key Insights (AI)
  const insights = await generateAIInsights(data);
  addBulletSlide(ppt, 'Key Findings', insights);
  
  // Slide 8: Trends (AI)
  const trends = await analyzeAITrends(data);
  addTrendSlide(ppt, trends);
  
  // Slide 9: Recommendations (AI)
  const recommendations = await generateAIRecommendations(data, insights, trends);
  addBulletSlide(ppt, 'Recommended Actions', recommendations);
  
  // 3. Generate file
  const pptBuffer = await ppt.write('nodebuffer');
  
  // 4. Upload to R2
  const pptPath = `/exports/${sessionId}/report-${Date.now()}.pptx`;
  await r2.upload(pptPath, pptBuffer);
  
  // 5. Track AI usage
  await trackAIUsage(userId, 'ppt_generation', aiCreditsUsed);
  
  return { downloadUrl: pptPath, aiCreditsUsed };
}

// AI Functions
async function generateAISummary(data: any[]): Promise<string> {
  const sample = data.slice(0, 100); // Sample for AI
  
  const prompt = `
    Analyze this business data and write a 2-3 sentence executive summary.
    Data sample (first 100 rows): ${JSON.stringify(sample)}
    Focus on the most important insights for business stakeholders.
  `;
  
  const { text } = await generateText({
    model: mistral('ministral-3b'),
    prompt,
    temperature: 0.3,
    maxTokens: 200
  });
  
  return text;
}

async function generateAIInsights(data: any[]): Promise<string[]> {
  // Use deepseek for more sophisticated analysis
  const { object } = await generateObject({
    model: mistral('deepseek-r1-distill-llama-70b'),
    schema: z.object({
      insights: z.array(z.string()).length(5)
    }),
    prompt: `
      Analyze this data and identify the top 5 key findings.
      Each finding should be:
      - Specific and data-driven
      - Actionable
      - Maximum 15 words
      - Business-focused
      
      Data summary:
      - Total rows: ${data.length}
      - Columns: ${Object.keys(data[0]).join(', ')}
      - Sample: ${JSON.stringify(data.slice(0, 50))}
    `
  });
  
  return object.insights;
}
```

---

### 7.3 Cross-File Analysis

**Use Case:** Join sales.csv with customers.xlsx to enrich data.

**UI Flow:**
```
1. User navigates to "Analysis" tab
2. Clicks "Join Files"
3. Selects two sessions
4. Chooses join type (INNER, LEFT, RIGHT, FULL)
5. Maps join keys (customer_id = id)
6. Preview join results
7. Option to save as new session
```

**Backend:**
```typescript
// app/api/analysis/join/route.ts
export async function POST(req: Request) {
  const { leftSessionId, rightSessionId, joinType, on } = await req.json();
  
  // 1. Get R2 paths for both files
  const leftSession = await db.sessions.get(leftSessionId);
  const rightSession = await db.sessions.get(rightSessionId);
  
  // 2. Build DuckDB query
  const sql = `
    SELECT
      l.*,
      r.name as customer_name,
      r.email as customer_email,
      r.segment as customer_segment
    FROM read_parquet('${leftSession.r2_path_parquet}') l
    ${joinType} JOIN read_parquet('${rightSession.r2_path_parquet}') r
      ON l.${on.left} = r.${on.right}
  `;
  
  // 3. Execute join
  const db = new duckdb.Database(':memory:');
  const results = await db.all(sql);
  
  // 4. Optional: Save as new session
  if (saveAsNew) {
    // Export to Parquet
    await db.run(`COPY (${sql}) TO 'joined.parquet'`);
    
    // Upload to R2
    const newSessionId = nanoid();
    await r2.upload(`/files/${newSessionId}/data.parquet`, 'joined.parquet');
    
    // Create session record
    await db.sessions.create({
      id: newSessionId,
      name: `${leftSession.name} + ${rightSession.name}`,
      workspace_id: leftSession.workspace_id,
      ...
    });
    
    return { success: true, newSessionId };
  }
  
  // 5. Return preview
  return { success: true, results: results.slice(0, 100) };
}
```

---

### 7.4 Natural Language Queries

**Concept:** User types question in plain English → AI converts to SQL → Execute → Return results.

**Example Queries:**
- "Show me transactions over $10k from EU customers"
- "Find all pending orders from the last 30 days"
- "Which regions have the highest average order value?"
- "List customers who haven't ordered in 6 months"

**Implementation:**

```typescript
// lib/ai/nl-to-sql.ts
export async function naturalLanguageToSQL(
  query: string,
  sessionMetadata: SessionMetadata
): Promise<{ sql: string; explanation: string }> {
  
  const { sheets, columns } = sessionMetadata;
  
  const prompt = `
    You are a SQL expert. Convert this natural language query to DuckDB SQL.
    
    Available data:
    ${sheets.map(sheet => `
      Sheet: ${sheet.name}
      Columns: ${sheet.columns.map(c => `${c.name} (${c.type})`).join(', ')}
    `).join('\n')}
    
    User query: "${query}"
    
    Generate:
    1. Valid DuckDB SQL query
    2. Brief explanation of what the query does
    
    Important:
    - Use read_parquet('...') to access data
    - Always include a WHERE clause for the sheet name
    - Return a maximum of 1000 rows
    - Use proper column names and types
    
    Return JSON: { "sql": "...", "explanation": "..." }
  `;
  
  const { object } = await generateObject({
    model: mistral('deepseek-r1-distill-llama-70b'),
    schema: z.object({
      sql: z.string(),
      explanation: z.string()
    }),
    prompt,
    temperature: 0.1 // Low temp for accuracy
  });
  
  return object;
}

// API Route
export async function POST(req: Request) {
  const { sessionId, query } = await req.json();
  
  // 1. Get session metadata
  const session = await db.sessions.get(sessionId);
  
  // 2. Convert NL to SQL
  const { sql, explanation } = await naturalLanguageToSQL(query, session.metadata);
  
  // 3. Validate SQL (security check)
  if (!isValidReadOnlySQL(sql)) {
    throw new Error('Generated SQL contains unsafe operations');
  }
  
  // 4. Execute query
  const duckdb = new DuckDB(':memory:');
  const results = await duckdb.all(sql);
  
  // 5. Track AI usage
  await trackAIUsage(userId, 'nl_to_sql', tokensUsed);
  
  return {
    success: true,
    data: {
      sql,
      explanation,
      results,
      aiCreditsUsed: calculateCredits(tokensUsed)
    }
  };
}
```

---

## 8. Security & Compliance

### 8.1 Data Security

#### File Upload Security
```typescript
// lib/security/file-validator.ts
export async function validateUploadedFile(file: File): Promise<ValidationResult> {
  // 1. File type validation (magic bytes, not just extension)
  const buffer = await file.arrayBuffer();
  const magicBytes = new Uint8Array(buffer.slice(0, 8));
  
  const allowedTypes = {
    xlsx: [0x50, 0x4B, 0x03, 0x04], // ZIP signature
    csv: [/* text file signatures */]
  };
  
  if (!isValidMagicBytes(magicBytes, allowedTypes)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  // 2. Size validation
  const maxSize = 1024 * 1024 * 1024; // 1GB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  // 3. Filename sanitization
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // 4. Malware scan (ClamAV in production)
  if (process.env.NODE_ENV === 'production') {
    const scanResult = await scanFile(buffer);
    if (scanResult.infected) {
      return { valid: false, error: 'File contains malware' };
    }
  }
  
  return { valid: true, safeName };
}
```

---

#### SQL Injection Prevention
```typescript
// lib/duckdb/query-builder.ts
export class SecureQueryBuilder {
  /**
   * NEVER concatenate user input directly into SQL
   */
  private escapeValue(value: any): string {
    if (typeof value === 'string') {
      // Escape single quotes
      return `'${value.replace(/'/g, "''")}'`;
    }
    
    if (typeof value === 'number') {
      // Validate is actually a number
      if (isNaN(value)) {
        throw new Error('Invalid number');
      }
      return String(value);
    }
    
    // ... other types
  }
  
  /**
   * Validate column names (whitelist approach)
   */
  private isValidColumnName(column: string, allowedColumns: string[]): boolean {
    return allowedColumns.includes(column);
  }
  
  /**
   * Validate SQL is read-only
   */
  isReadOnlySQL(sql: string): boolean {
    const forbidden = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
      'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE'
    ];
    
    const upperSQL = sql.toUpperCase();
    return !forbidden.some(keyword => upperSQL.includes(keyword));
  }
}
```

---

#### Row Level Security (RLS)

**Enforced at Database Level (Supabase):**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

**Enforced at API Level:**
```typescript
// middleware.ts
export async function authMiddleware(req: Request) {
  // 1. Verify JWT
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new AuthError('Missing token');
  }
  
  const user = await verifyToken(token);
  
  // 2. Check resource ownership
  const { sessionId } = req.params;
  if (sessionId) {
    const session = await db.sessions.get(sessionId);
    if (session.user_id !== user.id) {
      throw new AuthError('Unauthorized');
    }
  }
  
  return user;
}
```

---

### 8.2 Data Privacy

#### GDPR Compliance

**Data Minimization:**
- Only store necessary metadata in Supabase
- Actual data stays in R2 (user-controlled)
- Option to delete all data on account deletion

**Right to Access:**
```typescript
// API: GET /api/user/data-export
export async function exportUserData(userId: string) {
  return {
    profile: await db.userProfiles.get(userId),
    workspaces: await db.workspaces.list(userId),
    sessions: await db.sessions.list(userId),
    // Generate download links for all files
    files: await generateDownloadLinks(userId)
  };
}
```

**Right to be Forgotten:**
```typescript
// API: DELETE /api/user/account
export async function deleteUserAccount(userId: string) {
  // 1. Delete all sessions (CASCADE deletes files references)
  await db.sessions.deleteByUser(userId);
  
  // 2. Delete files from R2
  await r2.deleteFolder(`/files/user-${userId}`);
  
  // 3. Delete workspaces
  await db.workspaces.deleteByUser(userId);
  
  // 4. Anonymize audit logs (keep for compliance, remove PII)
  await db.auditLogs.anonymize(userId);
  
  // 5. Delete user profile
  await db.userProfiles.delete(userId);
  
  // 6. Revoke Supabase auth
  await supabase.auth.admin.deleteUser(userId);
}
```

---

#### Data Encryption

**At Rest:**
- R2: AES-256 encryption (Cloudflare handles)
- Supabase: Encrypted by default (PostgreSQL + pgcrypto)
- Sensitive fields (credit cards): Additional encryption

**In Transit:**
- HTTPS everywhere (TLS 1.3)
- Certificate pinning (mobile apps)
- HSTS headers

**In Memory:**
- DuckDB processes data in-memory (temporary)
- No persistent storage of data
- Memory cleared after query completion

---

### 8.3 Compliance

#### SOC 2 Type II (Enterprise Plan)

**Controls to implement:**
- Audit logging (all actions)
- Access controls (RBAC)
- Data encryption
- Incident response plan
- Security training
- Vendor management
- Business continuity plan

**Evidence collection:**
```typescript
// lib/audit/logger.ts
export async function logAuditEvent(event: AuditEvent) {
  await db.auditLogs.create({
    userId: event.userId,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    metadata: event.metadata,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    timestamp: new Date()
  });
}

// Usage
await logAuditEvent({
  userId,
  action: 'session.create',
  resourceType: 'session',
  resourceId: sessionId,
  metadata: { fileName, fileSize },
  ipAddress: req.ip,
  userAgent: req.headers.get('user-agent')
});
```

---

## 9. Performance Requirements

### 9.1 Target Metrics

| Operation | Target | Maximum Acceptable |
|-----------|--------|-------------------|
| **File Upload (100MB)** | < 10s | < 30s |
| **Excel → Parquet Conversion** | < 5s | < 15s |
| **Filter Application** | < 100ms | < 500ms |
| **Pagination (1000 rows)** | < 50ms | < 200ms |
| **Cross-File Join (50k + 50k rows)** | < 2s | < 5s |
| **Export to CSV (10k rows)** | < 1s | < 3s |
| **Export to PPT (Basic)** | < 2s | < 5s |
| **Export to PPT (Smart/AI)** | < 10s | < 30s |
| **Report Generation (HTML)** | < 3s | < 10s |

---

### 9.2 Scalability Targets

**Year 1:**
- 1,000 active users
- 10,000 sessions
- 500GB total storage
- 1M API requests/month

**Year 3:**
- 10,000 active users
- 500,000 sessions
- 50TB total storage
- 50M API requests/month

**Architecture can handle:**
- Serverless scales automatically (Vercel + R2)
- DuckDB processes per-request (stateless)
- Supabase handles 100k+ connections
- R2 unlimited storage

---

### 9.3 Monitoring

**Key Metrics to Track:**

```typescript
// lib/monitoring/metrics.ts
export const metrics = {
  // Performance
  'api.response_time': histogram(),
  'duckdb.query_time': histogram(),
  'r2.upload_time': histogram(),
  'r2.download_time': histogram(),
  
  // Business
  'uploads.count': counter(),
  'filters.applied': counter(),
  'exports.generated': counter(),
  'ai.credits_used': counter(),
  
  // Errors
  'errors.rate': counter(),
  'errors.by_type': counter({ labels: ['type'] }),
  
  // Resources
  'memory.used': gauge(),
  'storage.used_bytes': gauge({ labels: ['user_id'] })
};

// Usage
metrics['api.response_time'].observe(executionTime);
metrics['uploads.count'].inc();
```

**Alerting Rules:**
- API response time P95 > 500ms → Alert
- Error rate > 1% → Alert
- Storage usage > 90% → Alert
- AI costs > budget → Alert

---

## 10. Deployment Strategy

### 10.1 Infrastructure

**Production Stack:**
```yaml
Frontend & API:
  Provider: Vercel
  Region: Auto (global edge)
  Compute: Serverless Functions
  CDN: Cloudflare (via Vercel)
  
Database:
  Provider: Supabase
  Region: US East (primary)
  Type: PostgreSQL 15
  Backup: Daily, 30-day retention
  
File Storage:
  Provider: Cloudflare R2
  Region: Auto (global)
  CDN: Yes
  Lifecycle: 90-day cold storage for old files
  
Cache:
  Provider: Vercel KV (Redis)
  Region: US East
  TTL: Configured per key type
  
Monitoring:
  Errors: Sentry
  Logs: Axiom
  Uptime: BetterStack
  Analytics: Vercel Analytics + PostHog
```

---

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

### 10.3 Environment Variables

```bash
# .env.production
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=magixcel-files
R2_PUBLIC_URL=https://files.magixcel.com

# Vercel KV (Redis)
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx

# AI
OPENROUTER_API_KEY=sk-xxx
AI_MODEL_BASIC=mistral/ministral-3b
AI_MODEL_ADVANCED=deepseek/deepseek-r1-distill-llama-70b

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
AXIOM_TOKEN=xxx
BETTERSTACK_API_KEY=xxx

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_CROSS_FILE_JOINS=true
ENABLE_GOOGLE_DRIVE=false

# Limits
MAX_FILE_SIZE_MB=1024
MAX_STORAGE_PER_USER_GB=10
RATE_LIMIT_FREE=100
RATE_LIMIT_PRO=1000
```

---

## 11. Development Roadmap

### 11.1 MVP (Weeks 1-6)

**Week 1-2: Core Infrastructure**
- [ ] Next.js project setup
- [ ] Supabase integration
- [ ] Authentication (email/password)
- [ ] Database schema creation
- [ ] R2 storage setup

**Week 3-4: File Processing**
- [ ] DuckDB Node.js integration
- [ ] Excel processor (xlsx/xls)
- [ ] CSV processor
- [ ] Parquet conversion
- [ ] Upload API endpoint
- [ ] File validation & security

**Week 5-6: Data Viewing & Filtering**
- [ ] DataTable component (TanStack Table)
- [ ] FilterBuilder UI
- [ ] DuckDB query builder (FilterConfig → SQL)
- [ ] Filter API endpoint
- [ ] Pagination
- [ ] Multi-sheet support
- [ ] Export to CSV/Excel

**Deliverable:** Working prototype with upload, filter, view, export.

---

### 11.2 Beta (Weeks 7-9)

**Week 7: Polish & UX**
- [ ] Landing page
- [ ] Workspace system
- [ ] Session management
- [ ] Filter presets
- [ ] Global search
- [ ] Sort columns
- [ ] Error handling

**Week 8: Performance**
- [ ] Query caching (Vercel KV)
- [ ] Optimize Parquet conversion
- [ ] Lazy loading
- [ ] Virtual scrolling optimization
- [ ] Progress indicators

**Week 9: Beta Testing**
- [ ] 20 beta testers
- [ ] Feedback collection
- [ ] Bug fixes
- [ ] Documentation

**Deliverable:** Production-ready MVP.

---

### 11.3 Launch (Week 10)

- [ ] Deploy to production
- [ ] Launch Product Hunt
- [ ] Launch on Twitter/LinkedIn
- [ ] Email beta testers
- [ ] Monitor metrics
- [ ] Stripe integration (Pro plan)

**Goal:** 100 signups, 20 paying users in month 1.

---

### 11.4 Post-Launch (Months 2-3)

**Month 2:**
- [ ] AI features (NL to SQL, Smart PPT)
- [ ] Live HTML reports
- [ ] Cross-file joins
- [ ] Google Drive integration
- [ ] Business plan launch

**Month 3:**
- [ ] DuckDB WASM (client-side)
- [ ] Mobile responsive
- [ ] API access
- [ ] Enterprise features (SSO, audit logs)
- [ ] SOC 2 preparation

---

### 11.5 Year 1 Roadmap

**Q2 2025:**
- [ ] Advanced charts (customizable)
- [ ] Scheduled reports (email delivery)
- [ ] Collaboration features (comments, sharing)
- [ ] White-label reports (Business+)
- [ ] Reach €50k ARR

**Q3 2025:**
- [ ] Data pipelines (ETL)
- [ ] API marketplace
- [ ] Mobile app (React Native)
- [ ] International expansion (EU, UK)
- [ ] Reach €150k ARR

**Q4 2025:**
- [ ] Enterprise tier launch
- [ ] SOC 2 Type II certification
- [ ] On-premise option
- [ ] Reseller program
- [ ] Reach €400k ARR

---

## 12. Pricing & Business Model

### 12.1 Pricing Tiers

#### **FREE** - €0/month
- 5 uploads/month
- Max 10MB per file
- Basic filters
- Export CSV
- 1 workspace
- Community support

#### **PRO** - €69/month
- Unlimited uploads
- Max 1GB per file
- Advanced filters + SQL
- Export: CSV, Excel, JSON, Parquet
- PPT Basic (unlimited)
- PPT Smart (50/month, AI-powered)
- Cross-file joins
- Live HTML reports (10 active)
- 10 workspaces
- 10GB storage
- 50 AI credits/month
- Email support

#### **BUSINESS** - €199/month (5 users)
- Everything in Pro +
- PPT Smart (500/month)
- Live HTML reports (100 active)
- White-label reports
- Custom branding
- API access (10k calls/month)
- Scheduled reports
- 100 workspaces
- 100GB storage
- 500 AI credits/month
- Priority support
- Onboarding call

#### **ENTERPRISE** - Custom pricing
- Everything in Business +
- Unlimited everything
- SSO (SAML)
- Audit logs
- SLA 99.9%
- On-premise option
- Dedicated account manager
- Custom integrations
- SOC 2 compliance
- Custom contracts

---

### 12.2 Add-Ons

**Extra Storage:**
- +100GB: €19/month
- +1TB: €99/month

**AI Credits Pack:**
- 50 credits: €9
- 200 credits: €29
- 1000 credits: €99

**Additional Users (Business+):**
- +1 user: €29/month

---

### 12.3 Revenue Projections

**Year 1 (Conservative):**
```
Month 1:  €500    (10 Pro users)
Month 3:  €2,000  (25 Pro, 2 Business)
Month 6:  €5,000  (50 Pro, 8 Business)
Month 12: €10,000 (100 Pro, 20 Business, 2 Enterprise)

Total Year 1: €60,000 ARR
```

**Year 2 (Growth):**
```
Month 24: €35,000/month
Total Year 2: €320,000 ARR
```

**Year 3 (Scale):**
```
Month 36: €100,000/month
Total Year 3: €1,200,000 ARR
```

---

### 12.4 Unit Economics

**Customer Acquisition Cost (CAC):**
- Free → Pro: €100 (content marketing)
- Pro → Business: €500 (sales outreach)
- Business → Enterprise: €3,000 (enterprise sales)

**Lifetime Value (LTV):**
- Pro: €828 (12 months avg retention)
- Business: €3,582 (18 months avg retention)
- Enterprise: €35,880 (60 months avg retention)

**LTV:CAC Ratio:**
- Pro: 8.3x ✅
- Business: 7.2x ✅
- Enterprise: 12x ✅

**Target: >3x is healthy, >5x is excellent**

---

### 12.5 Competitive Analysis

| Feature | MagiXcel Pro | Excel 365 | Power BI | Tableau |
|---------|--------------|-----------|----------|---------|
| **Price/User** | €69/mo | €10/mo | €10-20/mo | €70/mo |
| **File Size** | 1GB | ~100MB | Unlimited* | Unlimited* |
| **Setup Time** | 0 min | 0 min | Hours | Hours |
| **Learning Curve** | Minutes | Varies | Weeks | Weeks |
| **AI Insights** | ✅ | Limited | ❌ | ❌ |
| **Live Reports** | ✅ | ❌ | ✅ | ✅ |
| **Cross-File Joins** | ✅ | Manual | ✅ | ✅ |
| **API Access** | ✅ | ❌ | ✅ | ✅ |

*Requires database setup

**Key Differentiators:**
- **vs Excel**: 10x faster, handles larger files, AI-powered
- **vs Power BI**: No setup required, simpler interface, same price
- **vs Tableau**: 90% of features at same price, much easier to use

---

## 13. Success Metrics

### 13.1 Product Metrics

**Activation:**
- % users who upload file within 24h: Target >70%
- % users who apply first filter: Target >60%
- % users who export data: Target >50%

**Engagement:**
- WAU/MAU ratio: Target >40%
- Avg sessions per week: Target >3
- Avg filters applied per session: Target >5

**Retention:**
- Day 7 retention: Target >40%
- Month 1 retention: Target >30%
- Month 3 retention: Target >20%

**Conversion:**
- Free → Pro: Target >10%
- Pro → Business: Target >15%
- Time to first paid conversion: Target <7 days

---

### 13.2 Business Metrics

**Growth:**
- MRR growth rate: Target >15%/month
- New signups: Target >100/month by Month 3
- Paying customers: Target >100 by Month 6

**Revenue:**
- MRR: Track monthly
- ARR: Target €60k Year 1, €320k Year 2, €1.2M Year 3
- ARPU (Average Revenue Per User): Target €80+

**Costs:**
- CAC: Target <€150 (Pro), <€600 (Business)
- LTV:CAC ratio: Target >5x
- Gross margin: Target >85%
- Churn rate: Target <10%/year

---

### 13.3 Technical Metrics

**Performance:**
- API response time P95: Target <500ms
- DuckDB query time P95: Target <200ms
- Uptime: Target >99.9%
- Error rate: Target <0.1%

**Infrastructure:**
- R2 storage cost per GB: ~€0.015/GB/month
- DuckDB compute cost: ~€0.001/query
- AI cost per PPT: €0.02-0.05
- Total infrastructure cost: Target <15% of revenue

---

## Appendix

### A. Glossary

**DuckDB**: In-process analytical database, similar to SQLite but for analytics (OLAP)
**Parquet**: Columnar file format, optimized for analytics
**WASM**: WebAssembly, allows running native code in browser
**R2**: Cloudflare's S3-compatible object storage
**RLS**: Row Level Security, database-level access control
**TTL**: Time To Live, cache expiration time
**OLAP**: Online Analytical Processing
**CAC**: Customer Acquisition Cost
**LTV**: Lifetime Value
**MRR**: Monthly Recurring Revenue
**ARR**: Annual Recurring Revenue
**ARPU**: Average Revenue Per User

---

### B. References

**DuckDB Documentation**: https://duckdb.org/docs/
**Vercel Documentation**: https://vercel.com/docs
**Supabase Documentation**: https://supabase.com/docs
**Cloudflare R2 Documentation**: https://developers.cloudflare.com/r2/
**TanStack Table**: https://tanstack.com/table/
**Vercel AI SDK**: https://sdk.vercel.ai/docs

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Status**: Architecture Complete - Ready for Development

---

**Next Steps:**
1. Review and approve this design document
2. Set up development environment
3. Create GitHub repository
4. Start Week 1 development (Core Infrastructure)
5. Weekly progress reviews

🚀 **Let's build MagiXcel!**

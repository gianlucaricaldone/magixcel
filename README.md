# MagiXcel

> **Advanced Excel & CSV analysis platform** with workspace management, persistent views, dynamic filtering, and sub-100ms query performance powered by DuckDB.

## ✨ Key Features

### 🗂️ **Workspace Management**
- Organize files into workspaces (NotebookLM-style)
- Color-coded workspace cards
- Each workspace isolates its views and sessions

### 📊 **Views System**
- **Explorer Tab**: Temporary filters for quick exploration
- **Views Tab**: Save filters as persistent, reusable views
- **Multiple Active Views**: Combine multiple views with AND logic
- **Charts Dashboard**: Create and visualize data with charts
- **Auto-save**: Changes saved automatically with debouncing

### ⚡ **High Performance**
- **DuckDB Engine**: Sub-100ms queries on multi-million row datasets
- **Parquet Storage**: 60-70% compression ratio vs. original files
- **Smart Caching**: Redis-compatible cache layer for instant results
- **Virtual Scrolling**: Smooth browsing of large datasets

### 🎯 **Advanced Filtering**
- Complex filter builder with 15+ operators
- AND/OR combinators
- Global search across all columns
- Save filter combinations as views
- Apply multiple views simultaneously

### 📈 **Data Visualization**
- Multiple chart types (bar, line, pie, doughnut, area, scatter)
- Grouping and aggregation support
- Responsive chart sizing
- Charts linked to views for persistence

### 🔄 **Multi-Sheet Excel Support**
- Views scoped to specific sheets
- Independent filtering per sheet
- Seamless sheet switching

---

## 🏗️ Tech Stack

### **Frontend**
- **Next.js 14** (App Router)
- **React 18** with TypeScript strict mode
- **TailwindCSS** + **shadcn/ui** (Radix UI primitives)
- **Zustand** for state management
- **TanStack Table** for data grids
- **Chart.js** + **react-chartjs-2** for visualizations

### **Backend & Data Processing**
- **DuckDB** (analytical queries on Parquet files)
- **Parquet** format (columnar storage, 60-70% compression)
- **ExcelJS** (Excel file processing)
- **PapaParse** (CSV parsing)

### **Database & Storage** (Adapter Pattern)
- **Development**: SQLite (local), Local Filesystem
- **Production**: Supabase (PostgreSQL), Cloudflare R2, Vercel KV/Redis

### **Architecture Highlights**
- **Adapter Pattern**: Seamless dev/prod environment switching
- **DuckDB Query Builder**: Translates filter configs to optimized SQL
- **Cache Layer**: Memory (dev) / Redis (prod)
- **Soft Deletes**: Sessions can be recovered
- **User Isolation**: Multi-tenancy ready with user_id

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd magixcel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   **Default development configuration** (`.env.local`):
   ```env
   NODE_ENV=development

   # Database (SQLite for development)
   DB_PROVIDER=sqlite
   SQLITE_DB_PATH=./data/magixcel.db

   # Storage (Local filesystem for development)
   STORAGE_PROVIDER=local
   LOCAL_STORAGE_PATH=./data/files

   # Cache (In-memory for development)
   CACHE_PROVIDER=memory

   # DuckDB Configuration
   DUCKDB_THREADS=4
   DUCKDB_MEMORY_LIMIT=2GB

   # Development User
   DEV_USER_ID=dev-user
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
magixcel/
├── app/
│   ├── api/                           # Next.js API routes
│   │   ├── upload/                    # File upload (Excel → Parquet)
│   │   ├── filter/                    # DuckDB queries with cache
│   │   ├── workspace/                 # Workspace CRUD
│   │   ├── session/                   # Session management
│   │   ├── views/                     # Views CRUD
│   │   └── active-views/              # Active views tracking
│   └── app/                           # Frontend pages
│       ├── workspace/[id]/            # Workspace detail
│       └── workspace/[id]/session/[id]/ # Session viewer
│
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── workspace/                     # Workspace components
│   ├── views/                         # Views feature components
│   ├── filters/                       # Filter builder
│   ├── charts/                        # Chart components
│   └── upload/                        # File uploader
│
├── lib/
│   ├── adapters/                      # Adapter Pattern
│   │   ├── db/                        # Database adapters (SQLite/Supabase)
│   │   ├── storage/                   # Storage adapters (Local/R2)
│   │   └── cache/                     # Cache adapters (Memory/Redis)
│   ├── duckdb/                        # DuckDB integration
│   │   ├── client.ts                  # DuckDB wrapper
│   │   └── query-builder.ts           # Filter → SQL conversion
│   └── processing/                    # Business logic
│       └── parquet-converter.ts       # Excel/CSV → Parquet
│
├── stores/                            # Zustand stores
│   ├── filter-store.ts                # Filters & views state
│   └── data-store.ts                  # Data & sheets state
│
├── types/                             # TypeScript definitions
│   ├── database.ts                    # DB models
│   ├── filters.ts                     # Filter types
│   └── charts.ts                      # Chart types
│
├── documentation/                     # Project docs
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── CODING_STANDARDS.md            # **READ THIS FIRST**
│   └── refactor/
│       └── magixcel-design-doc.md     # Design document
│
└── data/                              # Local data (git-ignored)
    ├── magixcel.db                    # SQLite database
    └── files/                         # Uploaded files & Parquet
```

---

## 🎯 Key Workflows

### 1️⃣ **Upload Flow**
```
File Upload → DuckDB Processing → Parquet Export → Storage Upload → DB Metadata Save
```
- File saved to temp directory
- DuckDB converts to Parquet (60-70% compression)
- Original + Parquet uploaded to storage
- Metadata (sheets, columns, row counts) saved to database

### 2️⃣ **Filter Flow**
```
User Filters → Cache Check → SQL Generation → DuckDB Query → Cache Result → Return
```
- Check cache for filter hash
- Build optimized SQL with QueryBuilder
- Execute query on Parquet file
- Cache result (1 hour TTL)
- Sub-100ms response time

### 3️⃣ **Views Flow**
```
Explorer (temp filters) → Save as View → View stored in DB → Activate View → Apply filters
```
- Explorer Tab: Temporary filters (saved in `sessions.active_filters`)
- Views Tab: Persistent views (saved in `views` table)
- Multiple views can be active → filters combined with AND logic
- Charts linked to views for persistence

---

## 🗄️ Database Schema

### **Core Tables**

**workspaces**
- Organizes sessions into workspaces
- Each workspace has color, icon, name, description
- One default workspace per user

**sessions**
- Represents uploaded files (Excel/CSV)
- Stores metadata (sheets, columns, row counts)
- Links to Parquet file in storage
- Soft delete support

**views**
- Persistent filter configurations
- Global to workspace (not sheet-specific)
- Can be public (shareable via link)
- Includes category, description

**view_charts**
- Charts linked to views
- Position, size, configuration stored as JSON

**active_views**
- Tracks which views are active on which sheets
- Enables multi-view AND logic

See [DATABASE_SCHEMA.md](./documentation/DATABASE_SCHEMA.md) for full schema.

---

## 🔧 Development

### **Database Reset**
```bash
rm -rf data/
npm run dev  # Auto-creates fresh database
```

### **Type Checking**
```bash
npm run type-check
```

### **Linting**
```bash
npm run lint
```

### **Environment Variables**

**Development** (SQLite + Local Storage):
```env
DB_PROVIDER=sqlite
STORAGE_PROVIDER=local
CACHE_PROVIDER=memory
```

**Production** (Supabase + R2 + Redis):
```env
DB_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=magixcel-files

CACHE_PROVIDER=redis
REDIS_URL=redis://your-redis-url
```

---

## 📚 Documentation

**Essential Reading:**
- **[CODING_STANDARDS.md](./documentation/CODING_STANDARDS.md)** ⭐ **READ FIRST**
- [ARCHITECTURE.md](./documentation/ARCHITECTURE.md) - Architecture decisions
- [DATABASE_SCHEMA.md](./documentation/DATABASE_SCHEMA.md) - Database schema
- [API_ENDPOINTS.md](./documentation/API_ENDPOINTS.md) - API documentation
- [FEATURE_ROADMAP.md](./documentation/FEATURE_ROADMAP.md) - Feature roadmap
- [DEPLOYMENT_GUIDE.md](./documentation/DEPLOYMENT_GUIDE.md) - Deployment guide

**Design Documents:**
- [magixcel-design-doc.md](./documentation/refactor/magixcel-design-doc.md) - Refactor design doc

---

## 🛣️ Roadmap

### ✅ **Phase 1 - Core Infrastructure** (Complete)
- [x] Adapter Pattern (DB/Storage/Cache)
- [x] DuckDB integration
- [x] Parquet conversion
- [x] Workspace system
- [x] Session management
- [x] Views system with active views
- [x] Chart builder
- [x] Multi-sheet Excel support

### 🚧 **Phase 2 - Features** (In Progress)
- [ ] Command Palette (⌘K) - placeholder implemented
- [ ] Export to PowerPoint/PDF
- [ ] AI Insights tab
- [ ] View templates
- [ ] Duplicate view functionality
- [ ] Public view sharing
- [ ] Advanced filters (date range, regex)

### 🔮 **Phase 3 - Advanced** (Planned)
- [ ] Natural language queries
- [ ] Pattern recognition
- [ ] Data quality analysis
- [ ] Automated insights
- [ ] Real-time collaboration
- [ ] API for external integrations

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Read [CODING_STANDARDS.md](./documentation/CODING_STANDARDS.md) for conventions
2. Follow the adapter pattern for new integrations
3. Use TypeScript strict mode
4. Write tests for new features
5. Update documentation

---

## 📄 License

MIT

---

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js 14, DuckDB, and Parquet**

# MagiXcel Documentation

Complete technical documentation for MagiXcel - Excel/CSV data exploration platform.

---

## 📚 Documentation Index

### Core Architecture

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** ⭐ **START HERE**
   - Adapter Pattern (SQLite/Supabase, Local/R2, Memory/Redis)
   - DuckDB Analytics Engine integration
   - Parquet columnar format processing
   - Data flow diagrams
   - Workspace hierarchy model
   - Multi-sheet Excel support
   - Migration path to production

2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**
   - Complete database schema (SQLite + Supabase)
   - Tables: workspaces, sessions, views, view_charts
   - Indexes and constraints
   - JSONB fields structure
   - Adapter pattern implementation

3. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)**
   - All REST API endpoints
   - Request/Response formats
   - Error codes and handling
   - Authentication (future)
   - Rate limiting (future)

---

### UI & Components

4. **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** ⭐ **NEW - ViewSplitLayout**
   - Session page layout (fixed-height, no global scroll)
   - ViewSplitLayout component (3-column resizable)
   - Filters Panel (left) - view applied filters
   - Charts Panel (right) - chart grid with resize
   - DataTable with virtual scrolling
   - Chart components (display, builder)
   - View management (tabs, picker)
   - Workspace components (grid, modals)
   - Menu components (WorkspaceToolbar)
   - Filter builder UI
   - Common UI patterns (empty states, loading, badges)
   - Responsive design
   - Accessibility best practices

---

### Development

5. **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** ⭐ **READ BEFORE CODING**
   - Naming conventions (camelCase API, snake_case DB)
   - TypeScript best practices
   - React component patterns
   - API design patterns
   - Error handling
   - File organization
   - Code review checklist

6. **[LIVE_FILTERING.md](./LIVE_FILTERING.md)**
   - Live filter implementation details
   - Client-side filter application
   - Debouncing strategy
   - Per-sheet filter state management
   - Filter persistence to database

---

### Deployment & Operations

7. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
   - Development setup
   - Production deployment (Vercel)
   - Environment variables
   - Database migrations
   - Cloudflare R2 setup
   - Monitoring and logging

8. **[CHANGELOG.md](./CHANGELOG.md)**
   - Version history
   - Feature additions
   - Bug fixes
   - Breaking changes

9. **[FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)**
   - Planned features
   - Future improvements
   - Technical debt items

---

## 🚀 Quick Start

### For New Developers

1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** to understand the system
2. Read **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** before writing code
3. Reference **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** when working with data
4. Reference **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** when building features
5. Reference **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** when building UI

### For UI/UX Work

1. **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - Complete UI component guide
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Section "Data Flow" for understanding navigation

### For Backend/API Work

1. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - All endpoint specifications
2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Adapter pattern and DuckDB integration

---

## 📝 Recent Updates (2025-10-25)

### ViewSplitLayout - Three-Column Resizable Layout

Added comprehensive documentation for the new `ViewSplitLayout` component in **[UI_COMPONENTS.md](./UI_COMPONENTS.md)**:

**Filters Panel (LEFT):**
- Default: Closed
- Toggle: Vertical sidebar with Filter icon
- Resizable: 250px - 50% window width
- Content: List of applied filters from view
- Shows: column, operator, value for each filter
- Combinator indicator (AND/OR)
- Empty state when no filters

**Data Table (CENTER):**
- Fixed header with view name
- Toolbar with row/column count
- Virtual scrolling table
- Independent vertical scroll

**Charts Panel (RIGHT):**
- Default: Closed
- Toggle: Vertical sidebar with BarChart3 icon
- Resizable: 300px - 80% window width
- Content: Responsive grid of charts (1-3 columns)
- Grid auto-adjusts: `minmax(320px, 400px)` per card
- Each chart max 400px width for compactness
- Independent vertical scroll

**Layout Architecture:**
- Session page uses `h-screen overflow-hidden` (no global scroll)
- All panels have independent scroll areas
- Resize handles with mouse drag
- Badge indicators show filter/chart counts
- Both panels can be open simultaneously

**Key Files:**
- `/components/workspace/ViewSplitLayout.tsx` - Main layout component
- `/app/workspace/[workspaceId]/session/[sessionId]/page.tsx` - Session page layout

---

## 🗂️ File Organization

```
documentation/
├── README.md                  # This file - Documentation index
├── ARCHITECTURE.md            # ⭐ Core architecture & design patterns
├── DATABASE_SCHEMA.md         # Complete database schema
├── API_ENDPOINTS.md           # All REST API endpoints
├── UI_COMPONENTS.md           # ⭐ NEW - UI components & patterns
├── CODING_STANDARDS.md        # ⭐ Development standards
├── LIVE_FILTERING.md          # Live filtering implementation
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── CHANGELOG.md               # Version history
└── FEATURE_ROADMAP.md         # Future features
```

**Total: 10 files** (including this README)

---

## 🎯 Documentation Principles

1. **Single Source of Truth**: Each topic documented in one place only
2. **Cross-Referenced**: Files link to related documentation
3. **Up-to-Date**: Documentation updated with code changes
4. **Practical**: Code examples and diagrams included
5. **Searchable**: Use clear headings and keywords

---

## 🔄 Keeping Documentation Updated

### When to Update Documentation

- **New Feature**: Update relevant guides + add to CHANGELOG
- **API Change**: Update API_ENDPOINTS.md
- **Database Change**: Update DATABASE_SCHEMA.md
- **UI Change**: Update UI_COMPONENTS.md
- **Breaking Change**: Update CHANGELOG with migration notes

### Documentation Review Checklist

Before merging code changes:
- [ ] Documentation reflects current implementation
- [ ] Code examples tested and working
- [ ] New features added to FEATURE_ROADMAP (if planned) or CHANGELOG (if completed)
- [ ] Breaking changes clearly marked
- [ ] Cross-references updated

---

## 📚 Additional Resources

### External Documentation
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [DuckDB Documentation](https://duckdb.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [TanStack Virtual](https://tanstack.com/virtual/latest)

### Project Files
- `/CLAUDE.md` - Claude AI development guide (project root)
- `/README.md` - Project overview (project root)
- `/package.json` - Dependencies and scripts

---

## 🤝 Contributing

When adding new documentation:
1. Place in appropriate existing file (avoid creating new files)
2. Follow existing format and style
3. Add cross-references to related sections
4. Update this README index
5. Keep examples concise and practical

---

**Last Updated**: 2025-10-25
**Maintained By**: Development Team

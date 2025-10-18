# Changelog

All notable changes to MagiXcel will be documented in this file.

---

## [Unreleased]

---

## [2.0.0] - 2025-10-18

### 🎨 UI/UX Improvements

#### Filter Presets - Modal UI
- **CHANGED**: Save/Load presets now open in modal dialogs instead of inline boxes
- **ADDED**: Backdrop overlay with fade animations for better focus
- **ADDED**: Close modals with ESC key, X button, or click outside
- **IMPROVED**: Vertical space usage - reduced from ~400px to 40px (90% reduction)

#### Update Preset Filters
- **ADDED**: 🔄 Green "Update Filters" button on each preset
- **ADDED**: Update existing preset with current filter configuration
- **ADDED**: Confirmation dialog before updating
- **FEATURE**: Preserves preset name, description, and category when updating filters

#### Visual Enhancements
- **ADDED**: Badge showing preset count on "Load Preset" button
- **ADDED**: Category dividers with decorative horizontal lines
- **IMPROVED**: Hover effects on preset cards (blue border + light blue background)
- **IMPROVED**: Empty state with folder icon + helpful message
- **ADDED**: 3-button action row per preset (Update, Edit, Delete)

### ⚡ Performance & Behavior

#### Live Filtering Toggle
- **ADDED**: Toggle to switch between live and manual filter application
- **ADDED**: ⚡ Icon and color-coded button (blue ON, gray OFF)
- **ADDED**: Conditional "Apply Filters" button when live filtering is OFF
- **ADDED**: Debounced global search (300ms) for live mode
- **FEATURE**: Allows building complex queries without performance impact

### 📚 Documentation

- **ADDED**: `LIVE_FILTERING.md` - Complete documentation for live filtering feature
- **UPDATED**: `FILTER_PRESETS.md` - Updated with modal UI and update filters feature
- **ADDED**: Changelog section in `FILTER_PRESETS.md` with v1.0 and v2.0
- **ADDED**: Testing checklist updates for new features

---

## [1.0.0] - 2025-10-18

### 🎉 Initial Release

#### Core Features

**Data Processing**
- Excel file support (.xlsx, .xls)
- CSV file support with auto-detection
- Type inference for columns
- Large file handling (up to 1GB planned)

**Filtering System**
- Advanced filter builder with 15+ operators
- Global search across all columns
- AND/OR combinators
- Grouped filters with SQL-like syntax
- Nested filter groups (infinite depth)
- Visual hierarchy with indentation

**Column Sorting**
- Click headers to sort (asc → desc → reset)
- Null values always sorted to bottom
- Visual indicators with colored arrows
- Works on filtered data

**Filter Presets**
- Save filter configurations as reusable presets
- Global presets (work across all files)
- Category organization
- CRUD operations (Create, Read, Update, Delete)
- Inline editing for metadata
- Name uniqueness validation

**UI Components**
- Landing page with feature showcase
- Upload page with drag-and-drop
- Session list with recent files
- Data table with pagination
- Filter builder with recursive rendering
- shadcn/ui components (Button, Card, Tabs, Progress)

#### Database & API

**Database**
- SQLite for development
- Database abstraction layer for Supabase migration
- Tables: sessions, files, saved_filters, cached_results, filter_presets
- Indexes for performance
- Foreign keys with CASCADE delete

**API Endpoints**
- `POST /api/upload` - File upload with processing
- `GET /api/sessions` - List recent sessions
- `GET /api/session/[id]` - Get session metadata
- `GET /api/session/[id]/data` - Get session data
- `DELETE /api/session/[id]` - Delete session
- `GET /api/filter-presets` - List filter presets
- `POST /api/filter-presets` - Create preset
- `GET /api/filter-presets/[id]` - Get preset
- `PUT /api/filter-presets/[id]` - Update preset
- `DELETE /api/filter-presets/[id]` - Delete preset

#### State Management

**Zustand Stores**
- `session-store` - Session and upload state
- `data-store` - Data, filtering, sorting, pagination
- `filter-store` - Filters, groups, presets, live filtering

#### Documentation

- `PROJECT_OVERVIEW.md` - Vision and architecture
- `DATABASE_SCHEMA.md` - Database design
- `API_ENDPOINTS.md` - API documentation
- `ARCHITECTURE.md` - System architecture
- `NAMING_CONVENTIONS.md` - Code style guide
- `FEATURE_ROADMAP.md` - Development phases
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `ADVANCED_FEATURES.md` - Sorting and grouped filters
- `FILTER_PRESETS.md` - Filter presets system
- `ROUTE_CHANGES.md` - Route structure documentation

---

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

### Types of changes
- **ADDED** - New features
- **CHANGED** - Changes in existing functionality
- **DEPRECATED** - Soon-to-be removed features
- **REMOVED** - Removed features
- **FIXED** - Bug fixes
- **SECURITY** - Security fixes
- **IMPROVED** - Enhancements to existing features
- **FEATURE** - Major new capabilities

---

## Links

- [GitHub Repository](https://github.com/yourorg/magixcel)
- [Documentation](./documentation/)
- [Issues](https://github.com/yourorg/magixcel/issues)

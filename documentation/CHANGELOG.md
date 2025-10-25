# Changelog

All notable changes to MagiXcel will be documented in this file.

---

## [Unreleased]

---

## [3.0.0] - 2025-10-19

### 🎯 Major Features

#### Workspace Organization (NotebookLM-style)
- **ADDED**: Workspace system for organizing Excel files into projects
- **ADDED**: Create, read, update, delete (CRUD) operations for workspaces
- **ADDED**: Default workspace (ID: 'default') that cannot be deleted
- **ADDED**: Visual workspace customization (8 predefined colors)
- **ADDED**: Workspace grid view with card layout at `/app`
- **ADDED**: Workspace description and metadata fields
- **FEATURE**: Hierarchical structure: Workspaces → Sessions → Sheets

#### Multi-Sheet Excel Support
- **ADDED**: Full support for multi-sheet Excel files (.xlsx, .xls)
- **ADDED**: Excel-style sheet tabs for navigation between sheets
- **ADDED**: Per-sheet independent filter state
- **ADDED**: Persistent filter storage per sheet in database
- **FEATURE**: Live filtering applied automatically to all sheets
- **FEATURE**: Export all sheets with their respective filters applied
- **REMOVED**: Live/Manual toggle - all filters now auto-apply

### 🗄️ Database Changes

#### Workspace Table
- **ADDED**: `workspaces` table with fields: id, name, description, color, icon, timestamps
- **ADDED**: Foreign key `workspace_id` in `sessions` table
- **ADDED**: Cascade delete: removing workspace deletes all its sessions
- **ADDED**: Migration script `002_add_workspaces.sql`
- **FEATURE**: Automatic assignment of existing sessions to default workspace

#### Session Table Updates
- **ADDED**: `active_filters` column to store per-sheet filter state as JSON
- **ADDED**: Index on `workspace_id` for performance
- **CHANGED**: Sessions now must belong to a workspace

### 🔄 API Updates

#### Workspace Endpoints
- **ADDED**: `GET /api/workspace` - List all workspaces (with pagination)
- **ADDED**: `POST /api/workspace` - Create new workspace
- **ADDED**: `GET /api/workspace/:id` - Get workspace details
- **ADDED**: `PUT /api/workspace/:id` - Update workspace
- **ADDED**: `DELETE /api/workspace/:id` - Delete workspace (except default)
- **ADDED**: `GET /api/workspace/:id/sessions` - List sessions in workspace

#### Upload Endpoint
- **CHANGED**: `POST /api/upload` now accepts `workspaceId` parameter
- **CHANGED**: Defaults to 'default' workspace if not specified

### 🎨 UI/UX Changes

#### Workspace Components
- **ADDED**: `WorkspaceGrid` component with card layout
- **ADDED**: `CreateWorkspaceModal` with color picker
- **ADDED**: `EditWorkspaceModal` for modifying existing workspaces
- **ADDED**: Dropdown menu (3 dots) on workspace cards for Edit/Delete
- **ADDED**: Color picker with 8 predefined colors (Blue, Green, Amber, Red, Purple, Pink, Teal, Orange)
- **FIXED**: Edit menu now visible on default workspace (only Delete is hidden)

#### Sheet Navigation
- **ADDED**: Sheet tabs component for multi-sheet navigation
- **ADDED**: Active sheet indicator with visual highlighting
- **REMOVED**: Navbar from session page to maximize table space
- **ADDED**: Per-sheet filtered row count display

#### Filter Changes
- **REMOVED**: Live/Manual toggle - all filters now apply automatically
- **IMPROVED**: Filter state persists when switching between sheets
- **ADDED**: Visual feedback for active filters per sheet

### 🔀 Route Restructuring

#### New Route Structure
- **CHANGED**: `/app` now shows workspace grid (was upload/sessions)
- **CHANGED**: `/app/workspace/[workspaceId]` shows workspace detail page
- **CHANGED**: `/app/workspace/[workspaceId]/session/[sessionId]` shows session viewer
- **REMOVED**: Old route `/app/[sessionId]`

#### Component Updates
- **CHANGED**: `FileUploader` now accepts `workspaceId` prop
- **CHANGED**: `SessionList` filters sessions by workspace
- **UPDATED**: Navigation links to use new route structure

### 📦 State Management

#### Filter Store Updates
- **CHANGED**: Filter state structure from single `filters` to `filtersBySheet: Record<string, SheetFilters>`
- **ADDED**: `currentSheet` state for tracking active sheet
- **ADDED**: Methods for per-sheet filter management
- **FEATURE**: Independent filter state for each sheet in a session

#### Data Store Updates
- **ADDED**: Support for multi-sheet data storage
- **ADDED**: Sheet switching functionality
- **ADDED**: Per-sheet data caching

### 🛠️ Technical Improvements

#### Database
- **ADDED**: Migration system with `lib/db/migrations/`
- **ADDED**: `002_add_workspaces.sql` with transaction safety
- **IMPROVED**: Database abstraction layer with workspace methods

#### Error Handling
- **ADDED**: `NOT_FOUND` error code to constants
- **ADDED**: `VALIDATION_ERROR` error code to constants
- **IMPROVED**: Consistent error responses across workspace API

#### Components
- **ADDED**: Radix UI `DropdownMenu` component
- **ADDED**: Radix UI `Input` component
- **ADDED**: Radix UI `Label` component
- **ADDED**: Radix UI `Textarea` component

### 📚 Documentation

- **ADDED**: `WORKSPACE_STRUCTURE.md` - Complete workspace documentation
- **ADDED**: `MULTI_SHEET_SUPPORT.md` - Multi-sheet Excel feature documentation
- **UPDATED**: `API_ENDPOINTS.md` - Added workspace API routes
- **UPDATED**: `DATABASE_SCHEMA.md` - Added workspaces table and relationships
- **UPDATED**: `ARCHITECTURE.md` - Updated with new route structure
- **UPDATED**: This CHANGELOG.md with all changes

### 🔧 Dependencies

- **ADDED**: `@radix-ui/react-dropdown-menu` - Dropdown menus
- **ADDED**: `@radix-ui/react-label` - Form labels
- **ADDED**: `@radix-ui/react-dialog` - Modal dialogs (already present)

### ⚠️ Breaking Changes

- **BREAKING**: Route structure changed - old session links will not work
- **BREAKING**: Sessions now require `workspace_id` - migration script required
- **BREAKING**: API upload endpoint requires `workspaceId` (defaults to 'default' if not provided)
- **BREAKING**: Filter state structure changed from single object to per-sheet object

### 🔄 Migration Guide

For existing installations:
1. Run migration script: `002_add_workspaces.sql`
2. All existing sessions will be assigned to default workspace
3. Update any hardcoded route references in your code
4. No data loss - all sessions preserved

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

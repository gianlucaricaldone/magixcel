# Workspace Structure

## Overview
MagiXcel implements a NotebookLM-style workspace structure that organizes Excel/CSV files into hierarchical workspaces. This allows users to group related data files together and manage them as projects.

## Hierarchy

```
Workspaces
  └─ Sessions (Excel/CSV Files)
       └─ Sheets (for multi-sheet Excel files)
            └─ Data + Filters
```

### Three-Level Structure

1. **Workspace Level** - Top-level organizational unit
   - Contains multiple sessions
   - Has unique name, description, color, and icon
   - Default workspace always exists (ID: 'default')
   - Cannot be nested (single-level workspace structure)

2. **Session Level** - Individual Excel/CSV file
   - Belongs to exactly one workspace
   - Contains file metadata and data
   - For Excel files, can have multiple sheets
   - Each session has its own filter state

3. **Sheet Level** - Individual worksheet within Excel file
   - Multiple sheets per session (for .xlsx/.xls files)
   - Each sheet has independent filter state
   - CSV files treated as single-sheet sessions

## URL Structure

The application routes reflect the workspace hierarchy:

```
/app                                          → Workspace grid (list all workspaces)
/app/workspace/[workspaceId]                  → Workspace detail (sessions within workspace)
/app/workspace/[workspaceId]/session/[sessionId]  → Session viewer (data table with sheets)
```

**Example:**
```
/app                                          → See all workspaces
/app/workspace/marketing-2024                 → See all marketing Excel files
/app/workspace/marketing-2024/session/abc123  → View specific Excel file
```

## Workspace Features

### Visual Identification
Each workspace can be customized with:
- **Name**: Unique identifier (e.g., "Marketing Q4", "Sales Data")
- **Description**: Optional longer description of workspace purpose
- **Color**: One of 8 predefined colors for visual distinction
  - Blue (#3B82F6) - Default
  - Green (#10B981)
  - Amber (#F59E0B)
  - Red (#EF4444)
  - Purple (#8B5CF6)
  - Pink (#EC4899)
  - Teal (#14B8A6)
  - Orange (#F97316)
- **Icon**: Currently 'folder' (extensible for future icons)

### Default Workspace
- ID: `'default'`
- Cannot be deleted
- Can be edited (name, description, color)
- All existing sessions assigned to default during migration
- Fallback workspace for uploads without specified workspace

## User Workflows

### Creating a Workspace
1. Navigate to `/app`
2. Click "Create Workspace" card
3. Enter name, description (optional), choose color
4. Submit → redirects to new workspace page

### Uploading Files to Workspace
1. Navigate to workspace page: `/app/workspace/[workspaceId]`
2. Use "Upload" tab
3. Select Excel/CSV file
4. File automatically assigned to current workspace
5. Session created and linked to workspace

### Managing Workspaces
- **Edit**: Click 3-dot menu on workspace card → Edit
  - Update name, description, color
  - Available for all workspaces including default
- **Delete**: Click 3-dot menu → Delete
  - Cascade deletes all sessions in workspace
  - Not available for default workspace
  - Confirmation dialog before deletion

### Moving Between Workspaces
- Click workspace card to view its sessions
- Breadcrumb navigation (future enhancement)
- Sessions can only be moved via API (UI not yet implemented)

## Database Relationships

### Workspace Table
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder'
);
```

### Session → Workspace Foreign Key
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  -- ... other fields
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
```

**Cascade Behavior:**
- Deleting a workspace automatically deletes all its sessions
- Deleting a session does not affect the workspace
- Cannot delete workspace if it's the default workspace

## API Endpoints

### Workspace Management
- `GET /api/workspace` - List all workspaces
- `POST /api/workspace` - Create new workspace
- `GET /api/workspace/:id` - Get workspace details
- `PUT /api/workspace/:id` - Update workspace
- `DELETE /api/workspace/:id` - Delete workspace (except default)

### Session Management in Workspace
- `GET /api/workspace/:id/sessions` - List sessions in workspace
- `POST /api/upload?workspaceId=:id` - Upload file to specific workspace

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for full API documentation.

## Frontend Components

### Workspace Components
- **WorkspaceGrid** (`components/workspace/WorkspaceGrid.tsx`)
  - Grid display of workspace cards
  - Create workspace card
  - Edit/Delete dropdown menu

- **CreateWorkspaceModal** (`components/workspace/CreateWorkspaceModal.tsx`)
  - Modal for creating new workspaces
  - Color picker with 8 colors
  - Name and description fields

- **EditWorkspaceModal** (`components/workspace/EditWorkspaceModal.tsx`)
  - Modal for editing existing workspaces
  - Pre-fills current values
  - Same fields as create modal

### Session Components
- **FileUploader** - Accepts `workspaceId` prop
- **SessionList** - Filters sessions by workspace
- **SessionView** - Sheet tabs and data table

## Migration from Previous Structure

### Before
- No workspaces
- Flat structure: All sessions at `/app`
- Sessions accessed directly at `/app/[sessionId]`

### After
- Workspace-based organization
- Hierarchical: Workspaces → Sessions
- Sessions accessed at `/app/workspace/[workspaceId]/session/[sessionId]`

### Migration Process
1. Run migration `002_add_workspaces.sql`
2. Creates `workspaces` table
3. Creates default workspace (ID: 'default')
4. Adds `workspace_id` column to sessions
5. Assigns all existing sessions to default workspace
6. No data loss, all sessions preserved

## Future Enhancements

### Potential Features
- [ ] Nested workspaces (sub-folders)
- [ ] Workspace sharing/collaboration
- [ ] Move sessions between workspaces (UI)
- [ ] Workspace templates
- [ ] Custom workspace icons (beyond 'folder')
- [ ] Workspace search and filtering
- [ ] Breadcrumb navigation
- [ ] Workspace favorites/pinning
- [ ] Recently accessed workspaces
- [ ] Workspace-level analytics

### Considerations
- **Performance**: Large number of workspaces may require pagination
- **Search**: Implement search across workspaces and sessions
- **Permissions**: Future multi-user support would need workspace permissions
- **Export**: Bulk export all sessions in a workspace

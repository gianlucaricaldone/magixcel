# Filter Presets System 💾

Complete implementation for saving, loading, editing, and deleting filter configurations as reusable presets.

---

## Overview

**Filter Presets** allow users to save complex filter configurations and reuse them across different files/sessions. Presets are **global** (not tied to a specific session) and organized by categories.

---

## Features ✨

### 1. Save Current Filters as Preset
- Save the current filter configuration with:
  - **Name** (required, unique)
  - **Description** (optional)
  - **Category** (default: "Custom")
- Opens in **modal dialog** (not inline box)
- Validation: Name uniqueness enforced at database level

### 2. Load Preset
- Browse saved presets in **modal dialog** grouped by category
- Click "Apply Preset" to load filters instantly
- Replaces current filters with preset configuration
- Badge shows count of saved presets

### 3. Update Preset Filters (NEW!)
- **🔄 Green button** to update preset with current filters
- Useful for refining existing presets
- Confirmation dialog before update
- Preserves name/description/category

### 4. Edit Preset Metadata
- **✏️ Blue button** to edit name, description, or category
- Inline editing with save/cancel buttons
- Name conflict detection
- Does NOT change the filters

### 5. Delete Preset
- **🗑️ Red button** to remove preset
- Confirmation dialog
- Permanent deletion from database

### 6. Category Organization
- Presets grouped by category (e.g., "Sales", "Finance", "Custom")
- Category dividers with decorative lines
- Alphabetically sorted within categories

---

## Database Schema

### Table: `filter_presets`

```sql
CREATE TABLE IF NOT EXISTS filter_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  filter_config TEXT NOT NULL,  -- JSON string of IFilterConfig
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_filter_presets_name ON filter_presets(name);
CREATE INDEX idx_filter_presets_category ON filter_presets(category);
```

**Key Features:**
- `UNIQUE` constraint on `name` prevents duplicates
- No `session_id` - presets are **global**
- `filter_config` stores JSON serialized `IFilterConfig`
- `updated_at` tracks modifications

---

## API Endpoints

### `GET /api/filter-presets`
**List all presets** (optionally filtered by category)

**Query Parameters:**
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "id": "abc123",
      "name": "Active Customers",
      "description": "Shows only active customers with recent orders",
      "category": "Sales",
      "filter_config": "{\"filters\":[...],\"combinator\":\"AND\"}",
      "created_at": "2025-10-18T20:00:00Z",
      "updated_at": "2025-10-18T20:00:00Z"
    }
  ]
}
```

---

### `POST /api/filter-presets`
**Create a new preset**

**Body:**
```json
{
  "name": "VIP Customers",
  "description": "High-value customers",
  "category": "Sales",
  "filterConfig": {
    "filters": [...],
    "combinator": "AND"
  }
}
```

**Response:**
```json
{
  "success": true,
  "preset": { ... }
}
```

**Error Cases:**
- `400` - Invalid name or filter config
- `409` - Name already exists

---

### `GET /api/filter-presets/[id]`
**Get specific preset by ID**

**Response:**
```json
{
  "success": true,
  "preset": { ... }
}
```

---

### `PUT /api/filter-presets/[id]`
**Update existing preset**

**Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "category": "Finance",
  "filterConfig": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "preset": { ... }
}
```

**Error Cases:**
- `404` - Preset not found
- `409` - New name conflicts with another preset

---

### `DELETE /api/filter-presets/[id]`
**Delete a preset**

**Response:**
```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

---

## Store (Zustand)

### State

```typescript
interface FilterState {
  presets: IFilterPreset[];
  presetsLoading: boolean;

  // Preset Actions
  loadPresets: () => Promise<void>;
  savePreset: (name, description?, category?) => Promise<Result>;
  loadPreset: (id) => Promise<void>;
  updatePreset: (id, updates) => Promise<Result>;
  deletePreset: (id) => Promise<void>;
}
```

### Methods

#### `loadPresets()`
Fetches all presets from API and updates store state.

```typescript
const { loadPresets } = useFilterStore();

useEffect(() => {
  loadPresets();
}, []);
```

#### `savePreset(name, description?, category?)`
Saves current filter configuration as a new preset.

```typescript
const result = await savePreset(
  'Active Users',
  'Users who logged in last 30 days',
  'Analytics'
);

if (result.success) {
  console.log('Saved!', result.preset);
} else {
  console.error(result.error);
}
```

#### `loadPreset(id)`
Loads preset and replaces current filters.

```typescript
await loadPreset('preset-id-123');
// Current filters are now replaced with preset filters
```

#### `updatePreset(id, updates)`
Updates preset metadata or filters.

```typescript
const result = await updatePreset('preset-id-123', {
  name: 'New Name',
  description: 'Updated description',
  category: 'New Category',
  filterConfig: { ... } // Optional: update filters too
});
```

#### `deletePreset(id)`
Deletes preset permanently.

```typescript
await deletePreset('preset-id-123');
```

---

## UI Component: `FilterPresets`

### Location
`components/filters/FilterPresets.tsx`

### UI Structure

**Compact Button Row** (always visible):
```
[💾 Save Preset]  [📂 Load Preset (3)]
```
- Only 2 buttons, minimal vertical space
- Badge shows preset count
- Clicking opens modal

### Features

#### 1. Save Preset Modal
- **Trigger:** Click "Save Preset" button
- **Size:** 500px width, centered
- **Contents:**
  - Title: "Save Current Filters as Preset"
  - Description text
  - 3 input fields (Name, Description, Category)
  - Validation error messages
  - Footer with Cancel/Save buttons
- **Animations:** Fade-in, zoom-in, backdrop overlay
- **Close:** ESC key, X button, click outside

#### 2. Load Preset Modal
- **Trigger:** Click "Load Preset" button
- **Size:** 600px width, max-height 80vh
- **Contents:**
  - Title: "Load Saved Preset"
  - Scrollable preset list
  - Category dividers with decorative lines
  - Empty state with icon + message
- **Preset Card Actions:**
  - 🔄 **Update Filters** (green) - Update preset with current filters
  - ✏️ **Edit Metadata** (blue) - Edit name/description/category inline
  - 🗑️ **Delete** (red) - Remove preset
  - **Apply Preset** button - Load filters
- **Close:** ESC key, X button, click outside, Close button

#### 3. Edit Mode (Inline)
- Activated by clicking ✏️ button
- Shows 3 text inputs inline
- Green "Save" button (✓ icon)
- Gray "Cancel" button (X icon)
- Name conflict validation

### Usage

```tsx
import { FilterPresets } from '@/components/filters/FilterPresets';

// In FilterBuilder
<FilterPresets />
```

**Visual Example:**

```
Before click (Collapsed):
┌──────────────────────────────────┐
│ [💾 Save] [📂 Load (3)]          │  ← Only 40px height!
└──────────────────────────────────┘

After "Load" click (Modal):
        ╔════════════════════════════╗
        ║ Load Saved Preset      [X] ║
        ╠════════════════════════════╣
        ║ Apply a saved filter...    ║
        ║                            ║
        ║ ──────── Sales ──────      ║
        ║ ┌────────────────────────┐ ║
        ║ │ Active Customers       │ ║
        ║ │ Recent orders          │ ║
        ║ │ [🔄][✏️][🗑️]         │ ║
        ║ │ [Apply Preset]         │ ║
        ║ └────────────────────────┘ ║
        ║                            ║
        ║ [Close]                    ║
        ╚════════════════════════════╝
```

---

## Integration in FilterBuilder

**Location:** `components/filters/FilterBuilder.tsx`

```tsx
export function FilterBuilder({ columns }: FilterBuilderProps) {
  return (
    <div className="space-y-4">
      {/* Filter Presets - Always on top */}
      <FilterPresets />

      {/* Live Filtering Toggle */}
      <div>...</div>

      {/* Global Search */}
      <div>...</div>

      {/* Filters */}
      <div>...</div>
    </div>
  );
}
```

---

## User Workflows

### Workflow 1: Save Current Filters

1. User builds complex filter:
   ```
   ( AND
     - Status equals "Active"
     - Age > 30
     ( OR
       - City equals "NY"
       - City equals "LA"
     )
   )
   ```

2. Clicks **"Save Preset"**

3. Fills form:
   - Name: `"Active Adults in Major Cities"`
   - Description: `"Active users over 30 in NY or LA"`
   - Category: `"Demographics"`

4. Clicks **"Save"**

5. Preset is saved and appears in presets list

---

### Workflow 2: Load Preset

1. User opens a new file (different dataset)

2. Clicks **"Load Preset"**

3. Sees list of presets grouped by category:
   ```
   Demographics
     - Active Adults in Major Cities
     - Senior Citizens

   Sales
     - High Value Customers
     - Recent Purchases
   ```

4. Clicks **"Apply Preset"** on "Active Adults in Major Cities"

5. Filters are instantly applied to the current dataset

---

### Workflow 3: Update Preset Filters (NEW!)

1. User applies preset "High Value Customers" (Amount > 1000)

2. Realizes it needs refinement, adds filter: Status equals "Active"

3. Opens "Load Preset" modal

4. Clicks **🔄 green button** on "High Value Customers"

5. Confirmation: "Update 'High Value Customers' with current filters?"

6. Clicks **OK**

7. Preset now includes both filters:
   ```
   - Amount > 1000
   - Status equals "Active"
   ```

8. Name, description, and category remain unchanged

---

### Workflow 4: Edit Preset Metadata

1. User clicks **✏️ blue button** on a preset

2. Text inputs appear inline

3. Updates name, description, or category

4. Clicks **Check** icon to save or **X** to cancel

5. Changes are persisted to database

---

### Workflow 5: Delete Preset

1. User clicks **Delete** icon (trash) on a preset

2. Browser confirmation: "Are you sure?"

3. Clicks **OK**

4. Preset is removed from database and UI

---

## Example Use Cases

### Use Case 1: Analytics Team
**Category:** "Analytics"

- **"Active Users Last 30 Days"** - Users with recent activity
- **"Churned Users"** - Users inactive for 90+ days
- **"High Engagement"** - Users with 50+ sessions

### Use Case 2: Sales Team
**Category:** "Sales"

- **"VIP Customers"** - Total orders > $10,000
- **"Potential Upsell"** - Customers with 1-3 orders
- **"Lost Deals"** - Status = "Lost" AND Updated < 60 days ago

### Use Case 3: Finance Team
**Category:** "Finance"

- **"Overdue Invoices"** - Due date < Today AND Status != "Paid"
- **"High Value Transactions"** - Amount > $5,000
- **"Suspicious Activity"** - Velocity > 10 AND Country NOT IN ("US", "CA")

---

## Technical Details

### Type Definitions

**Database Type** (`types/database.ts`):
```typescript
export interface IFilterPreset {
  id: string;
  name: string;
  description?: string;
  category: string;
  filter_config: string; // JSON string
  created_at: string;
  updated_at: string;
}
```

**Filter Config** (`types/filters.ts`):
```typescript
export interface IFilterConfig {
  filters: (IFilter | IFilterGroup)[];
  combinator: FilterCombinator;
}
```

### Data Flow

**Save Flow:**
```
User clicks "Save Preset"
  ↓
UI form (name, description, category)
  ↓
Store: savePreset(name, desc, cat)
  ↓
API: POST /api/filter-presets { name, filterConfig: {...} }
  ↓
Database: INSERT with JSON.stringify(filterConfig)
  ↓
Response: { success: true, preset: {...} }
  ↓
Store: loadPresets() to refresh list
```

**Load Flow:**
```
User clicks "Apply Preset"
  ↓
Store: loadPreset(id)
  ↓
API: GET /api/filter-presets/[id]
  ↓
Database: SELECT * WHERE id = ?
  ↓
Response: { success: true, preset: { filter_config: "..." } }
  ↓
Store: Parse JSON and set filters/combinator
  ↓
FilterBuilder: Re-renders with new filters
  ↓
Live filtering (if enabled) applies instantly
```

---

## Performance Considerations

### Caching
- Presets loaded once on mount
- Cached in Zustand store
- Only refreshed after create/update/delete operations

### Query Optimization
- Database indexes on `name` and `category`
- `UNIQUE` constraint prevents duplicate queries

### UI Responsiveness
- Inline editing without full page reload
- Optimistic UI updates (local state changes before API response)
- Loading states during async operations

---

## Error Handling

### Name Conflicts
```typescript
const result = await savePreset('Existing Name', 'desc', 'cat');

if (!result.success) {
  // result.error = "A preset with this name already exists"
  showErrorMessage(result.error);
}
```

### Network Errors
```typescript
try {
  await loadPresets();
} catch (error) {
  console.error('Failed to load presets:', error);
  // Presets list remains empty, user can retry
}
```

### Invalid Filter Config
API validates `filterConfig` has:
- `filters` array
- `combinator` ('AND' or 'OR')

Returns `400 Bad Request` if invalid.

---

## Testing Checklist

### Save Preset
- [ ] Save with unique name succeeds
- [ ] Save with duplicate name shows error
- [ ] Save with empty name shows validation error
- [ ] Description and category are optional
- [ ] Preset appears in list after save

### Load Preset
- [ ] Clicking "Apply Preset" loads filters
- [ ] Current filters are replaced (not merged)
- [ ] Live filtering applies if enabled
- [ ] Loading works across different sessions/files

### Update Preset Filters
- [ ] Update button (🔄) updates filters with current state
- [ ] Confirmation dialog shows preset name
- [ ] Name/description/category remain unchanged
- [ ] Filters are replaced with current config
- [ ] Updated preset works correctly when applied

### Edit Preset Metadata
- [ ] Edit icon (✏️) enters edit mode
- [ ] Name changes are validated
- [ ] Check icon saves changes
- [ ] X icon cancels without saving
- [ ] Updated metadata appears immediately

### Delete Preset
- [ ] Confirmation dialog appears
- [ ] Clicking OK removes preset from list
- [ ] Clicking Cancel keeps preset
- [ ] Database record is deleted

### Category Grouping
- [ ] Presets grouped by category
- [ ] Categories sorted alphabetically
- [ ] Presets within category sorted by name
- [ ] Empty categories not shown

---

## Future Enhancements

### Planned Features
- [ ] **Export/Import** - Share presets as JSON files
- [ ] **Clone Preset** - Duplicate and modify
- [ ] **Preset History** - Version tracking
- [ ] **Smart Suggestions** - AI-recommended presets
- [ ] **Team Sharing** - Multi-user preset libraries
- [ ] **Preset Templates** - Built-in starter presets
- [ ] **Search/Filter** - Search presets by name/description

### Advanced Features
- [ ] **Preset Permissions** - Public vs Private presets
- [ ] **Preset Analytics** - Track usage frequency
- [ ] **Preset Validation** - Warn if columns don't exist
- [ ] **Batch Operations** - Delete multiple presets
- [ ] **Folder Organization** - Nested categories

---

## Migration Notes

### From Session-Specific to Global

Previously, `saved_filters` table was tied to sessions:
```sql
CREATE TABLE saved_filters (
  session_id TEXT NOT NULL,  -- Tied to specific session
  ...
);
```

New `filter_presets` table is **global**:
```sql
CREATE TABLE filter_presets (
  -- No session_id!
  ...
);
```

**Benefits:**
- Reuse presets across all files
- Centralized filter library
- Easier management

---

## Changelog

### v2.0 - UI Refresh (18 Oct 2025)

**Modal Dialogs Instead of Inline Boxes:**
- ✅ Save/Load now open in centered modal dialogs
- ✅ Backdrop overlay for focus
- ✅ Animations (fade, zoom, slide)
- ✅ Close with ESC, X button, or click outside
- ✅ Saves ~90% vertical space (40px vs 400px)

**Update Preset Filters Feature:**
- ✅ New 🔄 green button to update preset with current filters
- ✅ Confirmation dialog before update
- ✅ Preserves name/description/category
- ✅ Perfect for refining existing presets

**Visual Improvements:**
- ✅ Badge with preset count on "Load" button
- ✅ Category dividers with decorative lines
- ✅ Hover effects on preset cards
- ✅ 3-button action row (Update, Edit, Delete)
- ✅ Empty state with icon + helpful message

### v1.0 - Initial Release (18 Oct 2025)

- ✅ Save/Load/Edit/Delete presets
- ✅ Global presets (not session-specific)
- ✅ Category organization
- ✅ Complete API + Database layer
- ✅ Zustand store integration

---

## Summary

✅ **Complete implementation** of filter presets system
✅ **Modal-based UI** for clean, focused experience
✅ **Update filters** feature for preset refinement
✅ **Database schema** with indexes and constraints
✅ **API endpoints** for full CRUD operations
✅ **Zustand store** with async methods
✅ **Category organization** with visual dividers
✅ **Error handling** with validation
✅ **TypeScript** fully typed

---

**Date:** 18 October 2025
**Version:** 2.0 (Modal UI)
**Status:** ✅ Production Ready
**Breaking Changes:** None

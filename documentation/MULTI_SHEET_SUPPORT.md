# Multi-Sheet Excel Support

## Overview
MagiXcel provides full support for multi-sheet Excel files (.xlsx, .xls). Each sheet within a workbook is treated as an independent data table with its own filter state, allowing users to work with complex Excel files seamlessly.

## Features

### 1. Sheet Detection
- Automatically detects all sheets when uploading Excel files
- CSV files treated as single-sheet files (sheet name: "Sheet1")
- Sheet metadata stored in session data
- Sheet order preserved from original Excel file

### 2. Sheet Navigation
- Excel-style tab navigation at bottom of data table
- Click to switch between sheets
- Active sheet highlighted
- Shows all sheet names from workbook
- Smooth transition between sheets (no page reload)

### 3. Per-Sheet Filtering
Each sheet maintains independent filter state:
- Filters applied to one sheet don't affect other sheets
- Filter state persisted in database per sheet
- Switching sheets preserves both sheets' filters
- Live filtering on all sheets

### 4. Per-Sheet Data Display
- Each sheet has independent:
  - Column structure
  - Row count
  - Data content
  - Scroll position
  - Sort state (future)

## Architecture

### Data Storage

#### Session Data Structure
When an Excel file is uploaded, all sheets are stored:

```typescript
interface SessionData {
  sheets: {
    [sheetName: string]: {
      columns: string[];
      data: any[][];
      rowCount: number;
      columnCount: number;
    }
  };
  metadata: {
    fileName: string;
    fileType: 'xlsx' | 'xls' | 'csv';
    sheetCount: number;
    sheetNames: string[];
  };
}
```

#### Filter State Structure
Filters are stored per sheet in the database:

```typescript
interface SessionFilters {
  [sheetName: string]: {
    filters: Filter[];
    combinator: 'AND' | 'OR';
    appliedAt: string;
  }
}
```

Stored in `sessions.active_filters` column as JSON string.

### State Management

#### Filter Store (Zustand)
```typescript
interface FilterStore {
  filtersBySheet: Record<string, SheetFilters>;
  currentSheet: string;

  // Actions
  setSheet: (sheetName: string) => void;
  setFilters: (sheetName: string, filters: Filter[]) => void;
  getFilters: (sheetName: string) => Filter[];
  clearSheet: (sheetName: string) => void;
}
```

**Key Points:**
- `filtersBySheet` stores filters for each sheet separately
- Switching sheets updates `currentSheet`
- Filters fetched/applied based on `currentSheet`
- Each sheet's filter state isolated from others

#### Data Store (Zustand)
```typescript
interface DataStore {
  allSheets: Record<string, SheetData>;
  currentSheet: string;

  // Actions
  loadSheet: (sheetName: string) => Promise<void>;
  switchSheet: (sheetName: string) => void;
  getCurrentSheetData: () => SheetData;
}
```

## Implementation Details

### Sheet Tabs Component

**Location:** `components/session/SheetTabs.tsx` (or integrated in session view)

```typescript
<SheetTabs
  sheets={sheetNames}
  activeSheet={currentSheet}
  onSheetChange={(sheetName) => {
    setCurrentSheet(sheetName);
    loadSheetData(sheetName);
  }}
/>
```

**Features:**
- Excel-style horizontal tabs
- Scroll if too many sheets
- Active sheet indicator
- Hover effects

### Filter Persistence

#### Saving Filters
When filters are applied on a sheet:
1. Update Zustand store: `filtersBySheet[sheetName] = newFilters`
2. Send to backend: `PUT /api/session/:id`
3. Backend saves to database: `sessions.active_filters` column
4. JSON format preserves all sheet states

#### Loading Filters
When opening a session:
1. Backend loads `sessions.active_filters`
2. Parse JSON to get all sheets' filter states
3. Populate Zustand store with `filtersBySheet`
4. Apply filters to currently active sheet
5. Other sheets' filters ready when user switches

### Sheet Switching Flow

```
User clicks Sheet2 tab
  ↓
Update currentSheet state
  ↓
Check if Sheet2 filters exist in filtersBySheet
  ↓
Load Sheet2 data from backend/cache
  ↓
Apply Sheet2 filters (if any)
  ↓
Update UI with filtered Sheet2 data
  ↓
Sheet1 filters remain in memory for when user switches back
```

### Live Filtering Per Sheet

All filters are automatically applied (no manual "Apply" button):

1. **User adds/edits filter on Sheet1:**
   - Filter immediately applied to Sheet1 data
   - Filtered row count updated for Sheet1
   - Filter saved to `filtersBySheet.Sheet1`
   - Backend notified to persist state

2. **User switches to Sheet2:**
   - Sheet1 filters remain in memory
   - Sheet2 filters loaded and applied
   - Independent filter state maintained

3. **User returns to Sheet1:**
   - Previously applied Sheet1 filters still active
   - No need to reapply
   - State preserved across sheet switches

## Export with Multi-Sheet

### Current Behavior
When exporting a session with filters:
- Export includes ALL sheets
- Each sheet exported with its own applied filters
- Maintains multi-sheet structure in output Excel file
- CSV export only exports currently active sheet

### Export Implementation

```typescript
// Export all sheets with their respective filters
const exportData = {
  sessionId: session.id,
  format: 'xlsx',
  sheets: Object.keys(filtersBySheet).map(sheetName => ({
    sheetName,
    filters: filtersBySheet[sheetName].filters,
    combinator: filtersBySheet[sheetName].combinator,
  }))
};

// Backend processes each sheet separately
sheets.forEach(sheet => {
  const filteredData = applyFilters(
    allSheetData[sheet.sheetName],
    sheet.filters,
    sheet.combinator
  );
  workbook.addWorksheet(sheet.sheetName, filteredData);
});
```

### Export Options
- **XLSX**: All sheets with filters applied
- **CSV**: Active sheet only with its filters
- **JSON**: All sheets with filters as structured data

## UI/UX Considerations

### Sheet Tabs Styling
```css
.sheet-tab {
  /* Excel-like styling */
  padding: 8px 16px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.sheet-tab.active {
  border-bottom-color: #3B82F6;
  background: white;
}

.sheet-tab:hover {
  background: #F1F5F9;
}
```

### Filter Indicator
- Show filter count per sheet on tab
- Example: "Sheet1 (3)" indicates 3 active filters
- Visual indicator if sheet has unsaved changes

### Performance
- Lazy load sheet data (load on demand)
- Cache loaded sheets in memory
- Virtual scrolling for large sheets
- Debounce filter input to avoid excessive API calls

## Database Schema

### sessions.active_filters Column

**Type:** TEXT (JSON string)

**Example:**
```json
{
  "Sheet1": {
    "filters": [
      {
        "column": "Amount",
        "operator": "greaterThan",
        "value": 1000
      }
    ],
    "combinator": "AND",
    "appliedAt": "2024-01-15T10:30:00Z"
  },
  "Sheet2": {
    "filters": [
      {
        "column": "Status",
        "operator": "equals",
        "value": "Active"
      },
      {
        "column": "Date",
        "operator": "greaterThan",
        "value": "2024-01-01"
      }
    ],
    "combinator": "OR",
    "appliedAt": "2024-01-15T10:35:00Z"
  }
}
```

## API Endpoints

### Get Session with Sheets
```
GET /api/session/:id
```

**Response:**
```typescript
{
  success: true,
  session: {
    id: string,
    name: string,
    sheets: {
      [sheetName: string]: {
        columns: string[],
        data: any[][],
        rowCount: number,
        columnCount: number
      }
    },
    activeFilters: {
      [sheetName: string]: {
        filters: Filter[],
        combinator: 'AND' | 'OR'
      }
    }
  }
}
```

### Apply Filters to Specific Sheet
```
POST /api/filter
```

**Request:**
```typescript
{
  sessionId: string,
  sheetName: string,  // Target sheet
  filters: Filter[],
  combinator: 'AND' | 'OR',
  pagination?: {
    page: number,
    pageSize: number
  }
}
```

### Update Active Filters (Persist)
```
PUT /api/session/:id
```

**Request:**
```typescript
{
  activeFilters: {
    [sheetName: string]: {
      filters: Filter[],
      combinator: 'AND' | 'OR'
    }
  }
}
```

## Future Enhancements

### Planned Features
- [ ] Sheet rename functionality
- [ ] Sheet reordering
- [ ] Duplicate sheet with filters
- [ ] Cross-sheet formulas (read-only)
- [ ] Sheet-level statistics dashboard
- [ ] Compare data between sheets
- [ ] Merge sheets (union/join operations)
- [ ] Split sheet by filter criteria
- [ ] Sheet templates

### Performance Optimizations
- [ ] Incremental loading (paginate within sheet)
- [ ] Web Workers for filter computation
- [ ] IndexedDB caching for large files
- [ ] Stream processing for massive sheets
- [ ] Progressive rendering

### Advanced Filtering
- [ ] Cross-sheet filter references
- [ ] Filter based on other sheet's data
- [ ] Global filters affecting all sheets
- [ ] Filter templates per sheet type

## Limitations

### Current Limitations
1. **Sheet Formulas**: Not evaluated, shown as raw values
2. **Formatting**: Cell formatting not preserved (data only)
3. **Charts**: Not rendered (data only)
4. **Macros**: Not executed (data only)
5. **Protected Sheets**: Protection ignored
6. **Hidden Rows/Columns**: Shown normally

### Size Limits
- Max file size: 1GB (configurable)
- Max sheets per file: Unlimited (performance may vary)
- Max rows per sheet: Unlimited (virtual scrolling)
- Max columns per sheet: 100 (UI limit, configurable)

## Troubleshooting

### Common Issues

**Q: Filters not persisting when switching sheets**
- Check that `active_filters` column exists in database
- Verify Zustand store is correctly updating `filtersBySheet`
- Check browser console for API errors

**Q: Sheet tabs not appearing**
- Ensure Excel file has multiple sheets
- Check that sheet metadata is correctly parsed during upload
- Verify `sheetNames` array in session data

**Q: Performance degradation with many sheets**
- Implement lazy loading of sheet data
- Enable virtual scrolling
- Consider pagination within large sheets
- Use Web Workers for filter computation

**Q: Export includes wrong sheets**
- Verify `filtersBySheet` state before export
- Check that all sheets' filters are correctly passed to export API
- Ensure backend loops through all sheets

## Examples

### Example 1: Sales Report with Multiple Sheets
```
File: sales_report_2024.xlsx
Sheets:
  - Q1 Sales (filtered: Amount > 10000)
  - Q2 Sales (filtered: Region = "West" OR Region = "East")
  - Q3 Sales (no filters)
  - Q4 Sales (filtered: Status = "Closed", Date > 2024-10-01)

User workflow:
1. Upload sales_report_2024.xlsx
2. Click "Q1 Sales" tab
3. Add filter: Amount > 10000
4. Click "Q2 Sales" tab
5. Add filters: Region = "West" OR "East"
6. Export → All sheets exported with respective filters applied
```

### Example 2: Budget Tracking
```
File: budget_2024.xlsx
Sheets:
  - Income (filter: Category = "Salary")
  - Expenses (filter: Amount > 500, Type = "Recurring")
  - Summary (no filter)

Features:
- Each sheet maintains independent filters
- Summary sheet shows totals (read-only calculated values)
- Export preserves all three sheets with filters
```

## See Also
- [LIVE_FILTERING.md](./LIVE_FILTERING.md) - How live filters work
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API documentation
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database structure

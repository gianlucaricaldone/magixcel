# UI Components & Patterns

## Overview

MagiXcel uses a component-based architecture with **shadcn/ui** (Radix UI primitives) and **TailwindCSS** for styling.

---

## Page Layout Structure

### Session Page Layout
Fixed-height layout that prevents global scrolling and provides independent scroll areas.

```typescript
// app/workspace/[workspaceId]/session/[sessionId]/page.tsx
<div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
  {/* Fixed Header Components */}
  <div className="flex-shrink-0"><TopBar /></div>
  <div className="flex-shrink-0"><SheetTabs /></div>
  <div className="flex-shrink-0"><WorkspaceToolbar /></div>

  {/* Main Content Area - Takes remaining vertical space */}
  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
    {activeView ? <ViewSplitLayout /> : <DataTable />}
  </div>

  {/* Fixed Footer Components */}
  <div className="flex-shrink-0"><ViewSheetTabs /></div>
  <div className="flex-shrink-0"><StatusBar /></div>
</div>
```

**Key Principles:**
- `h-screen` limits height to viewport (prevents global scroll)
- `flex-shrink-0` prevents header/footer from compressing
- `flex-1 overflow-hidden min-h-0` allows content area to fill and manage scroll
- Each section manages its own scroll independently

---

## ViewSplitLayout Component

Three-column resizable layout for viewing data with filters and charts.

### Layout Structure

```
┌─────────────┬─────────────────────┬─────────────┐
│  Filters    │  Data Table         │  Charts     │
│  Panel      │                     │  Panel      │
│  (LEFT)     │                     │  (RIGHT)    │
│             │                     │             │
│  [Filters]  │  [View Name]        │  [Charts]   │
│             │  [Toolbar]          │             │
│             │  [Virtual Table]    │  [Grid]     │
│   Scroll ↕  │   Scroll ↕          │   Scroll ↕  │
│             │                     │             │
└─────────────┴─────────────────────┴─────────────┘
  Resize →←     Flexible Width        Resize →←
```

### Implementation

```typescript
// components/workspace/ViewSplitLayout.tsx
export function ViewSplitLayout({ view, data, columns }) {
  // State for both panels
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [filtersPanelWidth, setFiltersPanelWidth] = useState(350);
  const [isChartsPanelOpen, setIsChartsPanelOpen] = useState(false);
  const [chartsPanelWidth, setChartsPanelWidth] = useState(400);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* LEFT: Filters Panel */}
      {isFiltersPanelOpen && (
        <>
          <div className="flex-shrink-0" style={{ width: filtersPanelWidth }}>
            <FiltersPanel />
          </div>
          <div className="w-1 cursor-col-resize" /* Resize handle */ />
        </>
      )}

      {/* LEFT: Vertical Toggle (when closed) */}
      {!isFiltersPanelOpen && (
        <div className="w-12 flex-shrink-0">
          <button onClick={() => setIsFiltersPanelOpen(true)}>
            <Filter /> {/* Icon */}
          </button>
        </div>
      )}

      {/* CENTER: Data Table */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="h-14">View Name</div>
        <div className="h-10">Toolbar</div>
        <DataTable /> {/* Has its own scroll */}
      </div>

      {/* RIGHT: Charts Panel */}
      {isChartsPanelOpen && (
        <>
          <div className="w-1 cursor-col-resize" /* Resize handle */ />
          <div className="flex-shrink-0" style={{ width: chartsPanelWidth }}>
            <ChartsPanel />
          </div>
        </>
      )}

      {/* RIGHT: Vertical Toggle (when closed) */}
      {!isChartsPanelOpen && (
        <div className="w-12 flex-shrink-0">
          <button onClick={() => setIsChartsPanelOpen(true)}>
            <BarChart3 /> {/* Icon */}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Panel Features

#### Filters Panel (Left)
- **Default State**: Closed
- **Width**: 350px default, resizable 250px - 50% window
- **Content**:
  - Header with filter count badge
  - List of applied filters (column, operator, value)
  - Combinator indicator (AND/OR)
  - Empty state when no filters
- **Scroll**: Independent vertical scroll
- **Toggle**: Vertical sidebar with Filter icon + badge

#### Charts Panel (Right)
- **Default State**: Closed
- **Width**: 400px default, resizable 300px - 80% window
- **Content**:
  - Header with chart count badge
  - Grid of charts (responsive: 1-3 columns)
  - "Add Chart" button
  - Empty state when no charts
- **Scroll**: Independent vertical scroll
- **Toggle**: Vertical sidebar with BarChart3 icon + badge
- **Grid Layout**: `grid-template-columns: repeat(auto-fit, minmax(320px, 400px))`

### Resize Behavior

Both panels use mouse drag resize with constraints:

```typescript
// Filters Panel (left)
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = e.clientX; // Distance from left edge
    const minWidth = 250;
    const maxWidth = window.innerWidth * 0.5;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setFiltersPanelWidth(newWidth);
    }
  };
  // ... mouse up handler
}, [isResizingFilters]);

// Charts Panel (right)
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = window.innerWidth - e.clientX; // Distance from cursor to right edge
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.8;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setChartsPanelWidth(newWidth);
    }
  };
  // ... mouse up handler
}, [isResizingCharts]);
```

---

## Data Table Component

Virtual scrolling table with column sorting.

### Features
- **Virtual Scrolling**: @tanstack/react-virtual for performance
- **Column Sorting**: Click header to cycle: none → asc → desc → none
- **Formatting**: Numbers, dates, nulls formatted for display
- **Responsive**: Fixed header, scrollable body
- **Props**: Accepts `data` prop for filtered data override

### Structure

```typescript
export function DataTable({ columns, data }: DataTableProps) {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38, // Row height
    overscan: 10,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 overflow-x-auto">
        {columns.map((col) => (
          <div onClick={() => handleSort(col)}>
            {col} {getSortIcon(col)}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div className="flex-1 overflow-auto" ref={parentRef}>
        <div style={{ height: rowVirtualizer.getTotalSize() }}>
          {virtualItems.map((virtualRow) => (
            <div
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Row cells */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Critical CSS for Virtual Scrolling:**
- Parent must have `overflow-auto` for scroll container
- Parent must have `flex-1` to fill available space
- Virtual container has calculated `height` from getTotalSize()
- Rows use `transform: translateY()` for positioning

---

## Charts Components

### ChartDisplay

Renders individual charts with toolbar and interactions.

```typescript
export function ChartDisplay({ chart, data, onEdit, onDelete }) {
  const config = JSON.parse(chart.config);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <h3>{chart.title}</h3>
        <div className="flex gap-1">
          <Button onClick={() => setIsFullscreen(true)}>
            <Maximize2 /> {/* Fullscreen */}
          </Button>
          <Button onClick={handleExport}>
            <Download /> {/* Export as PNG */}
          </Button>
          <Button onClick={onEdit}><Edit2 /></Button>
          <Button onClick={onDelete}><Trash2 /></Button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-4">
        <div style={{ height: chart.size === 'small' ? '180px' : '280px' }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
```

**Chart Types Supported:**
- Bar, Line, Area
- Pie, Doughnut (aspect ratio 1:1 for compactness)
- Scatter, Bubble
- Radar

**Sizing:**
- Small: 180px height
- Medium: 280px height
- Max width: 400px (prevents overflow in panels)

### ChartBuilder

Modal dialog for creating/editing charts.

**Steps:**
1. Select chart type (bar, line, pie, etc.)
2. Configure axes (X-axis column, Y-axis aggregation)
3. Optional grouping (split by column)
4. Preview chart in real-time
5. Save to view

---

## View Management

### ViewSheetTabs (Bottom Tabs)

Horizontal tab bar at bottom of screen for switching between "All Data" and views.

```typescript
<div className="h-10 bg-slate-50 border-t flex items-center px-2 gap-1">
  {/* All Data Tab - Always visible */}
  <div
    className={activeViewId === null ? 'bg-white border-t-2' : 'bg-slate-100'}
    onClick={() => onSelectView(null)}
  >
    <Database className="h-3.5 w-3.5" />
    <span>All Data</span>
  </div>

  {/* View Tabs */}
  {openViews.map((view) => (
    <div
      className={activeViewId === view.id ? 'bg-white border-t-2' : 'bg-slate-100'}
      onClick={() => onSelectView(view.id)}
    >
      <Filter className="h-3.5 w-3.5" />
      <span>{view.name}</span>
      <button onClick={() => onCloseView(view.id)}>
        <X className="h-3 w-3" />
      </button>
    </div>
  ))}

  {/* Add View Button */}
  <button onClick={onAddView}>
    <Plus className="h-4 w-4" />
  </button>
</div>
```

**Behavior:**
- "All Data" tab always visible (shows unfiltered data)
- View tabs show name with close button (X)
- Active tab has white background + top border
- Click tab to switch view
- Click X to close view tab (doesn't delete view)

### ViewPickerDialog

Modal for selecting existing views to open.

```typescript
<Dialog>
  <DialogContent>
    <div className="grid gap-3">
      {views.map((view) => (
        <div
          className="border rounded-lg p-4 cursor-pointer hover:border-blue-500"
          onClick={() => onSelectView(view)}
        >
          <div className="flex justify-between">
            <h4>{view.name}</h4>
            <Badge>{filterCount} filters</Badge>
          </div>
          <p className="text-sm text-slate-600">{view.description}</p>
          <div className="text-xs text-slate-500">
            {chartCount} charts · Updated {formatRelative(view.updated_at)}
          </div>
        </div>
      ))}
    </div>
  </DialogContent>
</Dialog>
```

---

## Workspace Components

### WorkspaceGrid

Grid of workspace cards with color coding.

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {workspaces.map((workspace) => (
    <div
      className="border rounded-lg p-6 cursor-pointer hover:shadow-lg"
      style={{ borderLeftWidth: '4px', borderLeftColor: workspace.color }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: workspace.color + '20' }}
        >
          <FolderIcon style={{ color: workspace.color }} />
        </div>
        <h3>{workspace.name}</h3>
      </div>
      <p className="text-sm text-slate-600">{workspace.description}</p>
      <div className="text-xs text-slate-500 mt-3">
        {sessionCount} sessions
      </div>
    </div>
  ))}
</div>
```

**Color Palette:**
- Blue: #3B82F6
- Green: #10B981
- Purple: #8B5CF6
- Orange: #F59E0B
- Red: #EF4444
- Pink: #EC4899
- Indigo: #6366F1
- Teal: #14B8A6

---

## Menu Components

### WorkspaceToolbar

Professional dropdown menu bar below TopBar.

```typescript
<div className="h-10 bg-white border-b flex items-center px-4 gap-1">
  {/* File Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger>
      File <ChevronDown />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem><FileDown /> Export</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Session Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger>Session <ChevronDown /></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem><Save /> Salva</DropdownMenuItem>
      <DropdownMenuItem><FilePlus /> Salva come nuova Sessione</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* View Menu */}
  <DropdownMenu>
    <DropdownMenuTrigger>View <ChevronDown /></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem><Plus /> Crea View</DropdownMenuItem>
      <DropdownMenuItem><ListPlus /> Applica View</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* Share, Settings menus... */}
</div>
```

**Menu Structure:**
- **File**: Export operations
- **Session**: Save, Save as new
- **View**: Create view, Apply view
- **Share**: Share session
- **Settings**: Preferences

---

## Filter Components

### FilterBuilder

Component for building complex filter queries.

```typescript
<div className="space-y-4">
  {/* Combinator */}
  <div className="flex items-center gap-2">
    <span>Match</span>
    <Select value={combinator} onValueChange={setCombinator}>
      <SelectItem value="AND">ALL</SelectItem>
      <SelectItem value="OR">ANY</SelectItem>
    </Select>
    <span>of the following:</span>
  </div>

  {/* Filter Rules */}
  {filters.map((filter, index) => (
    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
      {/* Column Select */}
      <Select value={filter.column}>
        {columns.map((col) => <SelectItem value={col}>{col}</SelectItem>)}
      </Select>

      {/* Operator Select */}
      <Select value={filter.operator}>
        <SelectItem value="equals">equals</SelectItem>
        <SelectItem value="contains">contains</SelectItem>
        <SelectItem value="greaterThan">greater than</SelectItem>
        {/* ... more operators */}
      </Select>

      {/* Value Input */}
      <Input
        value={filter.value}
        onChange={(e) => updateFilter(index, 'value', e.target.value)}
      />

      {/* Remove Button */}
      <Button variant="ghost" onClick={() => removeFilter(index)}>
        <X />
      </Button>
    </div>
  ))}

  {/* Add Filter Button */}
  <Button onClick={addFilter}>
    <Plus /> Add Filter
  </Button>
</div>
```

**Operators Supported:**
- **String**: equals, notEquals, contains, notContains, startsWith, endsWith, isEmpty, isNotEmpty
- **Number**: equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual
- **Date**: equals, notEquals, before, after
- **Array**: in, notIn

---

## Common UI Patterns

### Empty States

```typescript
<div className="flex items-center justify-center h-full">
  <div className="text-center max-w-md">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
      <Icon className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">No items yet</h3>
    <p className="text-sm text-slate-600 mb-4">
      Description of empty state
    </p>
    <Button>Action</Button>
  </div>
</div>
```

### Loading States

```typescript
<div className="flex items-center justify-center h-full">
  <div className="text-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
    <p className="text-sm text-slate-600">Loading...</p>
  </div>
</div>
```

### Badge with Icon

```typescript
<Badge variant="outline">
  <Icon className="h-3 w-3 mr-1" />
  {count}
</Badge>
```

---

## Responsive Design

### Breakpoints (Tailwind)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Grid Responsiveness

```typescript
// Workspace Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// Charts Grid (in panel)
<div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))' }}>
```

### Mobile Considerations (Future)
- Stack panels vertically instead of horizontally
- Full-screen modals on mobile
- Touch-friendly button sizes (min 44x44px)
- Swipe gestures for tab navigation

---

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for dropdown navigation

### ARIA Labels
```typescript
<button aria-label="Close filters panel" onClick={close}>
  <X className="h-4 w-4" />
</button>

<div role="tablist">
  <button role="tab" aria-selected={isActive}>Tab</button>
</div>
```

### Focus Management
- Focus trap in modals
- Focus first input when modal opens
- Return focus to trigger element when modal closes

---

## Performance Best Practices

### Memoization
```typescript
const filteredData = useMemo(() => {
  return applyFilters(data, filterConfig);
}, [data, filterConfig]);

const columns = useMemo(() => {
  return data.length > 0 ? Object.keys(data[0]) : [];
}, [data]);
```

### Virtual Scrolling
- Always use for tables >100 rows
- Always use for lists >50 items
- Set proper `estimateSize` for accurate scrollbar

### Lazy Loading
```typescript
const ChartBuilder = lazy(() => import('@/components/charts/ChartBuilder'));

<Suspense fallback={<Loader />}>
  <ChartBuilder />
</Suspense>
```

### Debouncing
```typescript
const debouncedSearch = useDebounce(searchQuery, 300);
```

---

## Component Library

MagiXcel uses **shadcn/ui** components built on **Radix UI** primitives:

### Installed Components
- Button
- Input, Textarea, Label
- Select, Dropdown Menu
- Dialog, Alert Dialog
- Badge, Card
- Tabs, Accordion
- Tooltip, Popover
- Table (styled, not virtual)

### Custom Components
- DataTable (virtual scrolling)
- FilterBuilder (complex filter UI)
- ChartDisplay, ChartBuilder (chart management)
- WorkspaceGrid (workspace cards)
- ViewSplitLayout (three-column layout)

---

## Styling Guidelines

### Tailwind Classes
- **Spacing**: Use multiples of 4 (p-4, m-8, gap-2)
- **Colors**: Use slate for neutrals, blue for primary
- **Borders**: border-slate-200 for dividers
- **Shadows**: shadow-sm for cards, shadow-lg for modals
- **Transitions**: transition-colors for hovers

### CSS-in-JS (when needed)
```typescript
// Use style prop for dynamic values
<div style={{ width: `${panelWidth}px` }} />

// Use Tailwind classes for static values
<div className="w-12 h-14" />
```

### Class Naming
- Component files: PascalCase (DataTable.tsx)
- CSS classes: Tailwind utilities only
- No custom CSS classes (use Tailwind composition)

---

## Testing Components

### Component Tests (Future)
```typescript
describe('DataTable', () => {
  it('renders data correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Product Name')).toBeInTheDocument();
  });

  it('sorts by column when header clicked', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    fireEvent.click(screen.getByText('Price'));
    // Assert sorted order
  });
});
```

### Visual Regression (Future)
- Storybook for component showcase
- Chromatic for visual diffs
- Percy for screenshot testing

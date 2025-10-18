# Live Filtering Toggle ⚡

Feature that allows users to switch between automatic (live) and manual filter application.

---

## Overview

The **Live Filtering Toggle** gives users control over when filters are applied to the data:
- **ON (default)**: Filters apply automatically as you type/change (300ms debounce)
- **OFF**: Filters apply only when you click "Apply Filters" button

---

## UI Component

### Toggle Button

Located at the top of the FilterBuilder, the toggle shows current state with:
- **Icon**: Zap (⚡) when ON, ZapOff when OFF
- **Color**: Blue background when ON, Gray when OFF
- **Text**: "Live Filtering ON" or "Live Filtering OFF"
- **Description**: Contextual help text below

### Visual States

**Live Filtering ON:**
```
┌────────────────────────────────────────────────┐
│ [⚡ Live Filtering ON]                         │  ← Blue button
│ Filters apply automatically as you type        │  ← Gray helper text
└────────────────────────────────────────────────┘
```

**Live Filtering OFF:**
```
┌────────────────────────────────────────────────┐
│ [⚡ Live Filtering OFF]                        │  ← Gray button
│ Click "Apply Filters" to update results        │  ← Gray helper text
└────────────────────────────────────────────────┘
```

---

## Behavior

### When Live Filtering is ON

- Filters apply **automatically** on any change:
  - Global search input (debounced 300ms)
  - Filter column/operator/value changes
  - Filter add/remove
  - Group combinator changes
- **No "Apply Filters" button** visible
- Shows text: "Filters applied live"

### When Live Filtering is OFF

- Filters apply **only on button click**
- **"Apply Filters" button** appears (blue, prominent)
- User can build complex queries without performance impact
- Global search also requires button click

---

## Implementation

### Store State

**File:** `stores/filter-store.ts`

```typescript
interface FilterState {
  liveFiltering: boolean;
  setLiveFiltering: (enabled: boolean) => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  liveFiltering: true, // Default ON

  setLiveFiltering: (enabled) => set({ liveFiltering: enabled }),
}));
```

### Filter Application Logic

**File:** `components/filters/FilterBuilder.tsx`

```typescript
// Apply filters live whenever filters or global search changes
// (only if liveFiltering is enabled)
useEffect(() => {
  if (data.length === 0 || !liveFiltering) return;

  const filterConfig = getFilterConfig();
  const filtered = applyFilters(data, filterConfig, debouncedGlobalSearch);
  setFilteredData(filtered);
}, [filters, combinator, debouncedGlobalSearch, data, liveFiltering]);

// Manual apply filters function
const handleApplyFilters = () => {
  if (data.length === 0) return;

  const filterConfig = getFilterConfig();
  const filtered = applyFilters(data, filterConfig, globalSearch);
  setFilteredData(filtered);
};
```

### UI Toggle

```typescript
<button
  onClick={() => setLiveFiltering(!liveFiltering)}
  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
    liveFiltering
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
  }`}
>
  {liveFiltering ? (
    <>
      <Zap className="h-4 w-4" />
      <span className="text-sm font-medium">Live Filtering ON</span>
    </>
  ) : (
    <>
      <ZapOff className="h-4 w-4" />
      <span className="text-sm font-medium">Live Filtering OFF</span>
    </>
  )}
</button>
```

### Apply Button (Conditional)

```typescript
{!liveFiltering && (
  <Button
    variant="default"
    size="sm"
    onClick={handleApplyFilters}
    className="bg-blue-600 hover:bg-blue-700"
  >
    Apply Filters
  </Button>
)}
```

---

## Use Cases

### Use Case 1: Small Dataset (< 1000 rows)

**Recommendation:** Live Filtering ON

**Why:**
- Instant feedback
- No performance issues
- Better UX

**Example:**
```
User types "John" in global search
→ Results update instantly (debounced 300ms)
→ Smooth, responsive experience
```

---

### Use Case 2: Large Dataset (10k+ rows)

**Recommendation:** Live Filtering OFF

**Why:**
- Prevents lag during complex query building
- User can prepare entire filter set before execution
- Single expensive operation instead of many

**Example:**
```
User builds complex query:
  ( AND
    - Status equals "Active"
    - Amount > 1000
    ( OR
      - City equals "NY"
      - City equals "LA"
    )
    - Date within last 30 days
  )

→ All filters added without triggering processing
→ Click "Apply Filters" once
→ Single execution, no lag during setup
```

---

### Use Case 3: Testing Different Filters

**Scenario:** User wants to compare different filter combinations

**Workflow with Live OFF:**
```
1. Build Filter Set A
2. Click "Apply Filters"
3. Check results
4. Modify to Filter Set B (no processing yet)
5. Click "Apply Filters"
6. Compare results
```

**Benefit:** Clear separation between "editing" and "executing"

---

## Performance Comparison

### Live Filtering ON (Default)

| Action | Processing Triggered? |
|--------|----------------------|
| Type in global search | ✅ Yes (debounced 300ms) |
| Change filter column | ✅ Yes (immediate) |
| Change filter operator | ✅ Yes (immediate) |
| Change filter value | ✅ Yes (immediate) |
| Add filter | ✅ Yes (immediate) |
| Add group | ✅ Yes (immediate) |

**Total API calls for 5 changes:** ~5 calls

### Live Filtering OFF

| Action | Processing Triggered? |
|--------|----------------------|
| Type in global search | ❌ No |
| Change filter column | ❌ No |
| Change filter operator | ❌ No |
| Change filter value | ❌ No |
| Add filter | ❌ No |
| Add group | ❌ No |
| Click "Apply Filters" | ✅ Yes (once) |

**Total API calls for 5 changes + apply:** 1 call

---

## User Workflows

### Workflow 1: Quick Search (Live ON)

```
1. User loads 500-row dataset
2. Live Filtering: ON (default)
3. Types "acme" in global search
   → Results filter instantly to 15 rows
4. Changes filter: Status equals "Active"
   → Results update to 8 rows
5. Done! Fast, intuitive
```

---

### Workflow 2: Complex Query Building (Live OFF)

```
1. User loads 50k-row dataset
2. Toggles Live Filtering: OFF
3. Builds complex filter:
   - Add 5 filters
   - Create 2 nested groups
   - Set various combinators
   → No processing yet, UI stays responsive
4. Click "Apply Filters"
   → Single processing operation
5. Results appear (2,341 rows)
```

---

## Technical Details

### Debouncing (Live ON Only)

Global search uses 300ms debounce to prevent excessive filtering:

```typescript
const [globalSearch, setGlobalSearch] = useState('');
const debouncedGlobalSearch = useDebounce(globalSearch, 300);

// Only debouncedGlobalSearch triggers filtering
useEffect(() => {
  if (!liveFiltering) return;
  // ... apply filters with debouncedGlobalSearch
}, [debouncedGlobalSearch, liveFiltering]);
```

**Benefit:** User can type "John Smith" without triggering 11 separate filter operations

### Non-Debounced Global Search (Live OFF)

When live filtering is OFF, `globalSearch` (not debounced) is used:

```typescript
const handleApplyFilters = () => {
  const filtered = applyFilters(data, filterConfig, globalSearch);
  setFilteredData(filtered);
};
```

**Benefit:** Instant execution when button clicked, no 300ms delay

---

## Best Practices

### For Users

1. **Default ON** - Start with live filtering for immediate feedback
2. **Toggle OFF for large data** - Switch off when working with 10k+ rows
3. **Toggle OFF for complex queries** - Build without lag, apply once
4. **Toggle ON for exploration** - Quick data discovery with instant results

### For Developers

1. **Always check `liveFiltering` state** before auto-applying
2. **Use debounced values** for text inputs in live mode
3. **Show clear UI feedback** - Make toggle state obvious
4. **Provide "Apply" button** when live filtering is OFF
5. **Persist preference** (future: localStorage)

---

## Future Enhancements

- [ ] **Persist toggle state** - Remember user preference (localStorage)
- [ ] **Auto-detect dataset size** - Suggest OFF for large datasets
- [ ] **Smart debounce** - Adjust delay based on dataset size
- [ ] **Progress indicator** - Show "Filtering..." during heavy operations
- [ ] **Keyboard shortcut** - Ctrl+Enter to apply filters when OFF
- [ ] **Per-filter live toggle** - Enable live for some filters, manual for others

---

## Testing

### Test 1: Toggle State

1. Load dataset
2. Verify toggle is ON by default (blue)
3. Click toggle
4. Verify turns OFF (gray)
5. Verify text changes to "Live Filtering OFF"
6. Verify "Apply Filters" button appears

### Test 2: Live ON Behavior

1. Set toggle ON
2. Type in global search
3. Verify results update automatically (with debounce)
4. Add filter
5. Verify results update immediately
6. Verify no "Apply Filters" button

### Test 3: Live OFF Behavior

1. Set toggle OFF
2. Type in global search
3. Verify results DON'T update
4. Add 3 filters
5. Verify results DON'T update
6. Click "Apply Filters"
7. Verify results update once

### Test 4: Performance (Large Dataset)

1. Load 50k row dataset
2. Live ON: Add 5 filters → Measure lag
3. Live OFF: Add 5 filters → Verify no lag
4. Click "Apply Filters" → Measure single execution time
5. Compare: Multiple live updates vs single manual apply

---

## Summary

✅ **Live Filtering Toggle** gives users control over filter execution
✅ **Default ON** for instant feedback on small datasets
✅ **Toggle OFF** for building complex queries without lag
✅ **Debounced input** prevents excessive updates
✅ **Clear UI feedback** with colored button and helper text
✅ **Conditional "Apply" button** when live filtering is OFF

---

**Date:** 18 October 2025
**Feature:** Live Filtering Toggle
**Status:** ✅ Production Ready
**Breaking Changes:** None

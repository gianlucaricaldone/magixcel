# Coding Standards & Guidelines - MagiXcel

> **Purpose:** Mantenere coerenza e qualità del codice durante lo sviluppo del progetto MagiXcel.
> Ultimo aggiornamento: 2025-10-22

---

## 📋 Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [TypeScript & Types](#typescript--types)
3. [API Design](#api-design)
4. [Database Schema](#database-schema)
5. [React Components](#react-components)
6. [State Management](#state-management)
7. [File Organization](#file-organization)
8. [Error Handling](#error-handling)
9. [Testing & Validation](#testing--validation)

---

## 1. Naming Conventions

### 1.1 General Rules

| Context | Convention | Example |
|---------|-----------|---------|
| **TypeScript/JavaScript Variables** | camelCase | `const userName = 'John'` |
| **TypeScript/JavaScript Functions** | camelCase | `function getUserData() {}` |
| **React Components** | PascalCase | `function DataTable() {}` |
| **TypeScript Interfaces** | PascalCase with `I` prefix | `interface IUser {}` |
| **TypeScript Types** | PascalCase | `type FilterConfig = {}` |
| **Database Tables** | snake_case (plural) | `users`, `active_views` |
| **Database Columns** | snake_case | `user_id`, `created_at` |
| **API Routes** | kebab-case | `/api/active-views` |
| **File Names (Components)** | PascalCase | `DataTable.tsx` |
| **File Names (Utils)** | kebab-case | `filter-engine.ts` |
| **Constants** | UPPER_SNAKE_CASE | `const MAX_FILE_SIZE = 100` |

### 1.2 Critical Rule: API Request/Response Consistency

**ALWAYS use camelCase in API requests and responses:**

```typescript
// ✅ CORRECT
const response = await fetch('/api/views/123', {
  method: 'PUT',
  body: JSON.stringify({
    filterConfig: {...},  // camelCase
    isPublic: true,       // camelCase
  })
});

// ❌ WRONG - Will be ignored by API
const response = await fetch('/api/views/123', {
  method: 'PUT',
  body: JSON.stringify({
    filter_config: {...},  // snake_case - API won't recognize this!
    is_public: true,       // snake_case - API won't recognize this!
  })
});
```

**Rationale:** Database usa snake_case, ma API layer e frontend usano camelCase per JavaScript conventions.

---

## 2. TypeScript & Types

### 2.1 Interface Definitions

```typescript
// ✅ Database models - mirror database structure (snake_case)
export interface IView {
  id: string;
  name: string;
  workspace_id: string;      // snake_case (from DB)
  session_id: string;        // snake_case (from DB)
  filter_config: string;     // snake_case (from DB)
  created_at: string;        // snake_case (from DB)
  updated_at: string;        // snake_case (from DB)
}

// ✅ Component props - use camelCase
interface DataTableProps {
  data: any[];
  columns: string[];
  onRowClick?: (row: any) => void;  // camelCase
}
```

### 2.2 Type Safety

```typescript
// ✅ Always define return types for async functions
async function loadViews(workspaceId: string): Promise<IView[]> {
  // ...
}

// ✅ Use Partial for update operations
async function updateView(id: string, updates: Partial<IView>): Promise<IView> {
  // ...
}

// ✅ Avoid any - use unknown or specific types
// ❌ const data: any = await response.json();
// ✅ const data: ApiResponse<IView> = await response.json();
```

---

## 3. API Design

### 3.1 API Route Structure

```
/api/
  ├── views/
  │   ├── route.ts              # GET/POST /api/views
  │   └── [id]/
  │       ├── route.ts          # GET/PUT/DELETE /api/views/:id
  │       └── charts/
  │           └── route.ts      # GET/POST /api/views/:id/charts
  ├── active-views/
  │   └── route.ts              # GET/POST/DELETE /api/active-views
```

### 3.2 Request/Response Format

```typescript
// ✅ Standard API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ✅ Example API Handler
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, description, filterConfig } = body;  // camelCase destructuring

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
        { status: 400 }
      );
    }

    // Convert camelCase to snake_case for database
    const updates: Partial<IView> = {
      name,
      description,
      filter_config: JSON.stringify(filterConfig),  // Convert to snake_case here
    };

    const result = await db.updateView(params.id, updates);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

### 3.3 Query Parameters

```typescript
// ✅ Use camelCase for query params
GET /api/views?workspaceId=xxx&sessionId=xxx

// Parse in API route
const workspaceId = searchParams.get('workspaceId');  // camelCase
const sessionId = searchParams.get('sessionId');      // camelCase
```

---

## 4. Database Schema

### 4.1 Table Naming

```sql
-- ✅ Plural, snake_case
CREATE TABLE views (...);
CREATE TABLE active_views (...);
CREATE TABLE workspace_sessions (...);

-- ❌ Avoid
CREATE TABLE View (...);           -- Singular
CREATE TABLE activeViews (...);    -- camelCase
```

### 4.2 Column Naming

```sql
-- ✅ snake_case, descriptive
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,      -- Foreign key suffix: _id
  session_id TEXT NOT NULL,
  filter_config TEXT NOT NULL,     -- JSON stored as TEXT
  created_at TEXT DEFAULT (datetime('now')),   -- Timestamps: _at suffix
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ❌ Avoid
CREATE TABLE views (
  workspaceId TEXT,    -- camelCase
  filterconfig TEXT,   -- No underscore
  created TEXT         -- Missing _at suffix
);
```

### 4.3 Foreign Keys

```sql
-- ✅ Always add ON DELETE CASCADE for cleanup
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
```

---

## 5. React Components

### 5.1 Component Structure

```typescript
'use client';  // If client component

import { useState, useEffect } from 'react';
import { ComponentProps } from '@/types';

interface MyComponentProps {
  data: any[];
  onUpdate: (id: string) => void;
}

export function MyComponent({ data, onUpdate }: MyComponentProps) {
  // 1. State declarations
  const [isLoading, setIsLoading] = useState(false);

  // 2. useEffect hooks
  useEffect(() => {
    // ...
  }, []);

  // 3. Event handlers
  const handleClick = () => {
    // ...
  };

  // 4. Render logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 5.2 Props Naming

```typescript
// ✅ Event handlers: on[Action]
interface Props {
  onToggleView: (viewId: string) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
}

// ✅ Boolean props: is[State] or has[Feature]
interface Props {
  isOpen: boolean;
  isLoading: boolean;
  hasError: boolean;
}

// ✅ Data props: descriptive names
interface Props {
  activeViewIds: string[];     // Not: active, activeIds
  selectedViewId: string | null;
}
```

### 5.3 Component Files

```typescript
// ✅ Export named components
export function DataTable() { }

// ❌ Avoid default exports for components
export default function DataTable() { }  // Harder to refactor
```

---

## 6. State Management

### 6.1 Zustand Stores

```typescript
// stores/example-store.ts

interface ExampleState {
  // State
  items: IItem[];
  isLoading: boolean;

  // Actions (camelCase)
  loadItems: () => Promise<void>;
  updateItem: (id: string, updates: Partial<IItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useExampleStore = create<ExampleState>((set, get) => ({
  items: [],
  isLoading: false,

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/items');
      const result = await response.json();
      if (result.success) {
        set({ items: result.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // ...
}));
```

### 6.2 State Updates

```typescript
// ✅ Immutable updates
set((state) => ({
  items: [...state.items, newItem]
}));

// ❌ Avoid mutations
set((state) => {
  state.items.push(newItem);  // Mutates state!
  return state;
});
```

---

## 7. File Organization

```
/app/
  /api/                          # API routes
    /views/
      route.ts
      /[id]/
        route.ts
  /app/                          # Next.js app routes
    /workspace/[workspaceId]/
      /session/[sessionId]/
        page.tsx

/components/
  /ui/                           # Reusable UI components (shadcn)
    button.tsx
    dialog.tsx
  /dashboard/                    # Domain-specific components
    TopBar.tsx
    StatusBar.tsx
  /views/                        # Feature-specific components
    ViewsSidebar.tsx
    ViewsMainPanel.tsx

/lib/
  /db/                           # Database layer
    sqlite.ts
    supabase.ts
    /migrations/
      001_initial.sql
  /processing/                   # Business logic
    filter-engine.ts
    excel-processor.ts

/stores/                         # Zustand stores
  filter-store.ts
  data-store.ts

/types/                          # TypeScript definitions
  database.ts
  index.ts
```

---

## 8. Error Handling

### 8.1 API Error Responses

```typescript
// ✅ Consistent error format
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',  // Use ERROR_CODES constants
      message: 'User-friendly message'
    }
  },
  { status: 400 }  // Appropriate HTTP status
);

// ✅ Use predefined error codes
import { ERROR_CODES } from '@/lib/utils/constants';

return NextResponse.json(
  { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: '...' } },
  { status: 404 }
);
```

### 8.2 Frontend Error Handling

```typescript
// ✅ Always handle errors in async functions
const handleUpdate = async () => {
  try {
    const response = await fetch('/api/views/123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Update failed:', result.error);
      alert(result.error.message);  // Show user-friendly message
      return;
    }

    // Success handling
  } catch (error) {
    console.error('Network error:', error);
    alert('Failed to update. Please try again.');
  }
};
```

---

## 9. Testing & Validation

### 9.1 Input Validation

```typescript
// ✅ API route validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, workspaceId } = body;

  // Validate required fields
  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
      { status: 400 }
    );
  }

  if (!workspaceId || typeof workspaceId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Workspace ID is required' } },
      { status: 400 }
    );
  }

  // Proceed with business logic
}
```

### 9.2 Database Queries

```typescript
// ✅ Always check if record exists before update/delete
const existing = await db.getView(id);
if (!existing) {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'View not found' } },
    { status: 404 }
  );
}

// Proceed with update
await db.updateView(id, updates);
```

---

## 🎯 Quick Checklist for New Features

Before committing new code, verify:

- [ ] **Naming**: API usa camelCase, Database usa snake_case
- [ ] **Types**: Tutte le funzioni async hanno type annotations
- [ ] **Errors**: Tutti gli errori hanno handling con user-friendly messages
- [ ] **Validation**: Input validation su API routes
- [ ] **Consistency**: Naming conventions rispettate (camelCase/PascalCase/snake_case)
- [ ] **Dependencies**: useEffect dependencies corrette (no missing deps)
- [ ] **Cleanup**: useEffect cleanup functions dove necessario
- [ ] **Keys**: React keys su liste dinamiche
- [ ] **Accessibility**: Button/link semantics corretti
- [ ] **Logging**: Console.log rimossi o sostituiti con proper logging

---

## 📚 References

- **TypeScript Style Guide**: [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- **React Best Practices**: [React.dev](https://react.dev/learn)
- **Next.js Conventions**: [Next.js Docs](https://nextjs.org/docs)
- **Database Design**: [SQLite Best Practices](https://www.sqlite.org/lang.html)

---

**Ultimo update**: 2025-10-22
**Maintainer**: Development Team

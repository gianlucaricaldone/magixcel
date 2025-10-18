# Naming Conventions

## Files & Folders
- **Components**: PascalCase (`UserProfile.tsx`, `DataTable.tsx`)
- **Utilities**: kebab-case (`data-formatter.ts`, `file-validator.ts`)
- **Hooks**: camelCase starting with 'use' (`useDataFilter.ts`, `useFileUpload.ts`)
- **API Routes**: kebab-case folders (`api/upload/route.ts`, `api/filter/route.ts`)
- **Types**: PascalCase with 'I' prefix for interfaces (`IFilterConfig`, `ISessionData`)
- **Stores**: kebab-case with '-store' suffix (`session-store.ts`, `filter-store.ts`)

## Code Conventions

### Variables
```typescript
// camelCase for regular variables
const userData = {...};
const filterConfig = {...};
const isLoading = true;
```

### Constants
```typescript
// UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_FILE_TYPES = ['xlsx', 'xls', 'csv'];
const DEFAULT_PAGE_SIZE = 100;
```

### Functions
```typescript
// camelCase verbs describing the action
function processFile(file: File) {...}
function validateInput(data: unknown) {...}
function formatCurrency(value: number) {...}
```

### Classes
```typescript
// PascalCase nouns
class DataProcessor {...}
class FilterEngine {...}
class ExcelParser {...}
```

### Interfaces & Types
```typescript
// PascalCase with 'I' prefix for interfaces
interface IFilterConfig {
  column: string;
  operator: string;
  value: any;
}

// PascalCase for type aliases
type FilterOperator = 'equals' | 'contains' | 'greaterThan';
```

### Database
```sql
-- snake_case for all database entities
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP,
  original_file_name TEXT
);

CREATE TABLE saved_filters (
  id TEXT PRIMARY KEY,
  session_id TEXT
);
```

### Environment Variables
```bash
# UPPER_SNAKE_CASE
DATABASE_URL="file:./data/magixcel.db"
STORAGE_PATH="./data/uploads"
MAX_UPLOAD_SIZE="1073741824"
```

## Git Commit Messages
Follow conventional commits:
- `feat`: new feature (`feat: add natural language filtering`)
- `fix`: bug fix (`fix: resolve CSV parsing issue with commas`)
- `docs`: documentation (`docs: update API endpoints guide`)
- `style`: formatting, missing semicolons, etc (`style: format with prettier`)
- `refactor`: code restructuring (`refactor: extract filter logic to separate module`)
- `test`: adding tests (`test: add unit tests for Excel processor`)
- `chore`: maintenance (`chore: update dependencies`)
- `perf`: performance improvements (`perf: optimize virtual scrolling`)

## React Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface ComponentProps {
  data: any[];
}

// 3. Component
export function ComponentName({ data }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Handlers
  const handleClick = () => {...};

  // 6. Render
  return <div>...</div>;
}
```

## Import Aliases
```typescript
// Use @ alias for absolute imports
import { DataTable } from '@/components/table/DataTable';
import { processFile } from '@/lib/processing/excel-processor';
import { useSessionStore } from '@/stores/session-store';
```

## Avoid
- Single letter variables (except in loops: `i`, `j`, `k`)
- Abbreviations unless widely known (`btn` → `button`, `usr` → `user`)
- Prefixes like `my`, `the`, `data` without context
- Magic numbers (use named constants instead)

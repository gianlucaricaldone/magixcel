/**
 * Database Compatibility Layer
 *
 * @deprecated This file provides backward compatibility with the old database interface.
 * New code should use the adapter system directly:
 *
 * @example
 * ```typescript
 * import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
 *
 * const db = getDBAdapter();
 * const userId = getCurrentUserId();
 * const workspaces = await db.listWorkspaces(userId);
 * ```
 *
 * This wrapper will be removed in a future version once all code is migrated.
 */

import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import type { IDBAdapter } from '@/lib/adapters/db/interface';

/**
 * Database instance using new adapter system
 * @deprecated Use getDBAdapter() directly instead
 */
export const db: IDBAdapter = getDBAdapter();

/**
 * Get current user ID for database operations
 * @deprecated Use getCurrentUserId() from factory instead
 */
export const getUserId = getCurrentUserId;

/**
 * Re-export types from adapter interface for backward compatibility
 */
export type {
  IDBAdapter,
  IWorkspace,
  ISession,
  ISessionMetadata,
  IFilter,
  IActiveFiltersState,
  FilterOperator,
  IFilterPreset,
  IActiveView,
} from '@/lib/adapters/db/interface';

/**
 * Legacy type exports
 * @deprecated Import from '@/lib/adapters/db/interface' instead
 */
export type { IDatabase } from '@/types';

/**
 * Database Type Definitions
 *
 * This file re-exports types from the adapter layer for use throughout the application.
 * All types are now defined in lib/adapters/db/interface.ts
 */

// Import types for use in this file
import type {
  IDBAdapter,
  IWorkspace,
  ISession,
  ISessionMetadata,
  ISheetMetadata,
  IColumnMetadata,
  IActiveFiltersState,
  IFilter,
  IFilterGroup,
  FilterOperator,
  FilterCombinator,
  IFilterPreset,
  IFilterConfig,
  IView,
  IViewChart,
  IReport,
  IReportConfig,
  IExport,
  IActiveView,
} from '../lib/adapters/db/interface';

// Re-export all types from adapter interface
export type {
  IDBAdapter,
  IWorkspace,
  ISession,
  ISessionMetadata,
  ISheetMetadata,
  IColumnMetadata,
  IActiveFiltersState,
  IFilter,
  IFilterGroup,
  FilterOperator,
  FilterCombinator,
  IFilterPreset,
  IFilterConfig,
  IView,
  IViewChart,
  IReport,
  IReportConfig,
  IExport,
  IActiveView,
};

// Legacy types - kept for backward compatibility
// These will be gradually phased out

/**
 * @deprecated Use ISession.metadata instead
 * Old file storage model - replaced by r2_path_original and r2_path_parquet in ISession
 */
export interface IFile {
  id: string;
  session_id: string;
  file_type: string;
  storage_type: 'local' | 'cloud';
  storage_path: string;
  file_data?: Buffer;
  uploaded_at: string;
}

/**
 * @deprecated Use ICacheAdapter.get/set instead
 * Cached results are now handled by the cache adapter layer
 */
export interface ICachedResult {
  id: string;
  session_id: string;
  filter_hash: string;
  result_count: number;
  result_data: string; // JSON string
  created_at: string;
  expires_at?: string;
}

/**
 * @deprecated Use IView instead
 * ISavedFilter is now merged into IView (with view_type: 'filters_only')
 */
export interface ISavedFilter {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  filter_config: string; // JSON string
  created_at: string;
}

/**
 * View type enumeration
 */
export type ViewType = 'filters_only' | 'snapshot';

/**
 * @deprecated Use IDBAdapter interface instead
 * Old database interface - replaced by adapter pattern
 * Keeping for backward compatibility during migration
 */
export interface IDatabase {
  // Workspaces
  getWorkspace(id: string): Promise<IWorkspace | null>;
  createWorkspace(data: Omit<IWorkspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<IWorkspace>;
  updateWorkspace(id: string, data: Partial<Omit<IWorkspace, 'id' | 'user_id' | 'created_at'>>): Promise<IWorkspace>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(limit?: number, offset?: number): Promise<IWorkspace[]>;

  // Sessions
  getSession(id: string): Promise<ISession | null>;
  createSession(data: Omit<ISession, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_accessed_at' | 'deleted_at'>): Promise<ISession>;
  updateSession(id: string, data: Partial<ISession>): Promise<ISession>;
  deleteSession(id: string): Promise<void>;
  listSessions(limit?: number, offset?: number): Promise<ISession[]>;
  listSessionsByWorkspace(workspaceId: string, limit?: number, offset?: number): Promise<ISession[]>;

  // Files (deprecated - now handled by storage adapter)
  getFile?(id: string): Promise<IFile | null>;
  getFileBySession?(sessionId: string): Promise<IFile | null>;
  createFile?(data: Omit<IFile, 'id' | 'uploaded_at'>): Promise<IFile>;
  deleteFile?(id: string): Promise<void>;

  // Saved Filters (deprecated - now IFilterPreset)
  getSavedFilter?(id: string): Promise<ISavedFilter | null>;
  listSavedFilters?(sessionId: string): Promise<ISavedFilter[]>;
  createSavedFilter?(data: Omit<ISavedFilter, 'id' | 'created_at'>): Promise<ISavedFilter>;
  deleteSavedFilter?(id: string): Promise<void>;

  // Cached Results (deprecated - now handled by cache adapter)
  getCachedResult?(sessionId: string, filterHash: string): Promise<ICachedResult | null>;
  createCachedResult?(data: Omit<ICachedResult, 'id' | 'created_at'>): Promise<ICachedResult>;
  deleteCachedResult?(id: string): Promise<void>;
  deleteExpiredCache?(): Promise<number>;

  // Views
  getView?(id: string): Promise<IView | null>;
  getViewByName?(name: string): Promise<IView | null>;
  getViewByPublicLink?(publicLinkId: string): Promise<IView | null>;
  listViews?(sessionId?: string, category?: string): Promise<IView[]>;
  createView?(data: Omit<IView, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'access_count'>): Promise<IView>;
  updateView?(id: string, data: Partial<Omit<IView, 'id' | 'user_id' | 'created_at'>>): Promise<IView>;
  deleteView?(id: string): Promise<void>;
  incrementViewAccessCount?(id: string): Promise<void>;

  // Backward compatibility aliases
  getFilterPreset?(id: string): Promise<IView | null>;
  getFilterPresetByName?(name: string): Promise<IView | null>;
  listFilterPresets?(category?: string): Promise<IView[]>;
  createFilterPreset?(data: Omit<IView, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'access_count'>): Promise<IView>;
  updateFilterPreset?(id: string, data: Partial<Omit<IView, 'id' | 'user_id' | 'created_at'>>): Promise<IView>;
  deleteFilterPreset?(id: string): Promise<void>;

  // View Charts
  getViewChart?(id: string): Promise<IViewChart | null>;
  listViewCharts?(viewId: string): Promise<IViewChart[]>;
  createViewChart?(data: Omit<IViewChart, 'id' | 'created_at' | 'updated_at'>): Promise<IViewChart>;
  updateViewChart?(id: string, data: Partial<Omit<IViewChart, 'id' | 'created_at'>>): Promise<IViewChart>;
  deleteViewChart?(id: string): Promise<void>;
  reorderViewCharts?(viewId: string, chartIds: string[]): Promise<void>;

  // Active Views
  listActiveViews?(sessionId: string, sheetName?: string | null): Promise<IActiveView[]>;
  activateView?(sessionId: string, sheetName: string | null, viewId: string): Promise<IActiveView>;
  deactivateView?(sessionId: string, sheetName: string | null, viewId: string): Promise<void>;
  isViewActive?(sessionId: string, sheetName: string | null, viewId: string): Promise<boolean>;
}

// Re-export ViewChart from charts types for backward compatibility
export type { ViewChart } from './charts';

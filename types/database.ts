/**
 * Database type definitions
 */

export interface IWorkspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  color: string; // Hex color code
  icon: string; // Icon identifier
}

export interface ISession {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  original_file_name: string;
  original_file_hash: string;
  row_count: number;
  column_count: number;
  file_size: number;
  file_type: 'xlsx' | 'xls' | 'csv';
  active_filters?: string; // JSON string containing filtersBySheet state
}

export interface IFile {
  id: string;
  session_id: string;
  file_type: string;
  storage_type: 'local' | 'cloud';
  storage_path: string;
  file_data?: Buffer;
  uploaded_at: string;
}

export interface ISavedFilter {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  filter_config: string; // JSON string
  created_at: string;
}

export interface ICachedResult {
  id: string;
  session_id: string;
  filter_hash: string;
  result_count: number;
  result_data: string; // JSON string
  created_at: string;
  expires_at?: string;
}

export type ViewType = 'filters_only' | 'snapshot';

export interface IView {
  id: string;
  name: string;
  description?: string;
  category: string;
  session_id?: string; // Optional: link view to specific session
  sheet_name?: string | null; // Sheet name for multi-sheet files (Excel); null for CSV
  filter_config: string; // JSON string of IFilterConfig
  view_type: ViewType;
  snapshot_data?: string; // JSON string of data rows (if view_type is 'snapshot')
  is_public: boolean;
  public_link_id?: string; // Unique link ID for public sharing
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  access_count: number;
  dashboard_layout?: string; // JSON string of DashboardLayout
  chart_count: number;
}

// Backward compatibility alias
export type IFilterPreset = IView;

// Import ViewChart from charts types
import { ViewChart } from './charts';

export interface IDatabase {
  // Workspaces
  getWorkspace(id: string): Promise<IWorkspace | null>;
  createWorkspace(data: Omit<IWorkspace, 'id' | 'created_at' | 'updated_at'>): Promise<IWorkspace>;
  updateWorkspace(id: string, data: Partial<Omit<IWorkspace, 'id' | 'created_at'>>): Promise<IWorkspace>;
  deleteWorkspace(id: string): Promise<void>;
  listWorkspaces(limit?: number, offset?: number): Promise<IWorkspace[]>;

  // Sessions
  getSession(id: string): Promise<ISession | null>;
  createSession(data: Omit<ISession, 'id' | 'created_at' | 'updated_at'>): Promise<ISession>;
  updateSession(id: string, data: Partial<ISession>): Promise<ISession>;
  deleteSession(id: string): Promise<void>;
  listSessions(limit?: number, offset?: number): Promise<ISession[]>;
  listSessionsByWorkspace(workspaceId: string, limit?: number, offset?: number): Promise<ISession[]>;

  // Files
  getFile(id: string): Promise<IFile | null>;
  getFileBySession(sessionId: string): Promise<IFile | null>;
  createFile(data: Omit<IFile, 'id' | 'uploaded_at'>): Promise<IFile>;
  deleteFile(id: string): Promise<void>;

  // Saved Filters
  getSavedFilter(id: string): Promise<ISavedFilter | null>;
  listSavedFilters(sessionId: string): Promise<ISavedFilter[]>;
  createSavedFilter(data: Omit<ISavedFilter, 'id' | 'created_at'>): Promise<ISavedFilter>;
  deleteSavedFilter(id: string): Promise<void>;

  // Cached Results
  getCachedResult(sessionId: string, filterHash: string): Promise<ICachedResult | null>;
  createCachedResult(data: Omit<ICachedResult, 'id' | 'created_at'>): Promise<ICachedResult>;
  deleteCachedResult(id: string): Promise<void>;
  deleteExpiredCache(): Promise<number>;

  // Views (formerly Filter Presets)
  getView(id: string): Promise<IView | null>;
  getViewByName(name: string): Promise<IView | null>;
  getViewByPublicLink(publicLinkId: string): Promise<IView | null>;
  listViews(sessionId?: string, category?: string): Promise<IView[]>;
  createView(data: Omit<IView, 'id' | 'created_at' | 'updated_at' | 'access_count' | 'chart_count'>): Promise<IView>;
  updateView(id: string, data: Partial<Omit<IView, 'id' | 'created_at'>>): Promise<IView>;
  deleteView(id: string): Promise<void>;
  incrementViewAccessCount(id: string): Promise<void>;

  // Backward compatibility aliases
  getFilterPreset(id: string): Promise<IView | null>;
  getFilterPresetByName(name: string): Promise<IView | null>;
  listFilterPresets(category?: string): Promise<IView[]>;
  createFilterPreset(data: Omit<IView, 'id' | 'created_at' | 'updated_at' | 'access_count' | 'chart_count'>): Promise<IView>;
  updateFilterPreset(id: string, data: Partial<Omit<IView, 'id' | 'created_at'>>): Promise<IView>;
  deleteFilterPreset(id: string): Promise<void>;

  // View Charts
  getViewChart(id: string): Promise<ViewChart | null>;
  listViewCharts(viewId: string): Promise<ViewChart[]>;
  createViewChart(data: Omit<ViewChart, 'id' | 'created_at' | 'updated_at'>): Promise<ViewChart>;
  updateViewChart(id: string, data: Partial<Omit<ViewChart, 'id' | 'created_at'>>): Promise<ViewChart>;
  deleteViewChart(id: string): Promise<void>;
  reorderViewCharts(viewId: string, chartIds: string[]): Promise<void>;
}

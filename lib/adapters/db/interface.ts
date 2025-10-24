/**
 * Database Adapter Interface
 *
 * Abstract interface for database operations.
 * Implementations: SQLite (dev), Supabase (prod)
 */

import { ViewChart } from '@/types/charts';

// ============================================================================
// TYPES - Updated for Supabase Schema
// ============================================================================

export interface IWorkspace {
  id: string;
  user_id: string; // NEW: User ownership
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  is_default: boolean; // NEW: Mark default workspace
  created_at: string;
  updated_at: string;
}

export interface ISession {
  id: string;
  workspace_id: string;
  user_id: string; // NEW: User ownership
  name: string;
  original_file_name: string;
  file_type: 'xlsx' | 'xls' | 'csv';
  file_size: number;
  file_hash: string; // SHA-256 for deduplication

  // NEW: R2 Storage paths (replaces old files table)
  r2_path_original: string; // /files/{id}/original.xlsx
  r2_path_parquet: string;  // /files/{id}/data.parquet

  // NEW: Flexible metadata as JSONB
  metadata: ISessionMetadata;

  // Active filters per sheet (JSON)
  active_filters?: IActiveFiltersState | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_accessed_at: string;

  // Soft delete
  deleted_at?: string | null;
}

export interface ISessionMetadata {
  sheets: ISheetMetadata[];
  totalRows: number;
  totalColumns: number;
  parquetSize?: number;
  compressionRatio?: number;
  processingTime?: number;
}

export interface ISheetMetadata {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: IColumnMetadata[];
}

export interface IColumnMetadata {
  name: string;
  type: string; // 'integer', 'decimal', 'varchar', 'date', etc.
}

export interface IActiveFiltersState {
  [sheetName: string]: {
    filters: IFilter[];
    combinator: 'AND' | 'OR';
    globalSearch?: string;
    appliedAt: string;
  };
}

export interface IFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between'
}

export type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'greaterThan' | 'lessThan'
  | 'greaterThanOrEqual' | 'lessThanOrEqual'
  | 'between' | 'in' | 'notIn'
  | 'isNull' | 'isNotNull'
  | 'startsWith' | 'endsWith';

export interface IFilterPreset {
  id: string;
  user_id: string; // NEW: User ownership
  name: string;
  description?: string | null;
  category: string;
  filter_config: IFilterConfig;
  use_count: number;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IFilterConfig {
  filters: IFilter[];
  combinator: 'AND' | 'OR';
}

export interface IView {
  id: string;
  workspace_id: string; // Views are global to workspace
  session_id: string;
  user_id: string; // NEW: User ownership
  name: string;
  description?: string | null;
  category: string;
  filter_config: IFilterConfig;
  view_type: 'filters_only' | 'snapshot';
  snapshot_data?: any[] | null;
  is_public: boolean;
  public_link_id?: string | null;
  is_default?: boolean;
  dashboard_layout?: any | null;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string | null;
  access_count: number;
}

export interface IViewChart {
  id: string;
  view_id: string;
  title: string;
  chart_type: string;
  config: any; // JSON chart configuration
  size: 'small' | 'medium' | 'large';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface IReport {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  description?: string | null;
  config: IReportConfig;
  r2_path_html?: string | null;
  r2_path_ppt?: string | null;
  public_url?: string | null;
  is_public: boolean;
  auto_refresh: boolean;
  refresh_interval?: string | null;
  ai_insights?: any | null;
  ai_credits_used: number;
  created_at: string;
  updated_at: string;
  last_refreshed_at?: string | null;
}

export interface IReportConfig {
  type: 'html' | 'ppt';
  sheets: string[];
  filters: IFilterConfig;
  charts: any[];
  refreshSchedule?: string;
  lastRefreshed?: string;
}

export interface IExport {
  id: string;
  session_id: string;
  user_id: string;
  format: 'csv' | 'xlsx' | 'json' | 'parquet' | 'ppt';
  r2_path: string;
  file_size?: number | null;
  row_count?: number | null;
  filter_config?: IFilterConfig | null;
  download_count: number;
  expires_at?: string | null;
  created_at: string;
}

export interface IActiveView {
  id: string;
  session_id: string;
  sheet_name: string | null; // Sheet name where this view is active (NULL for CSV)
  view_id: string;
  created_at: string;
}

// ============================================================================
// DATABASE ADAPTER INTERFACE
// ============================================================================

export interface IDBAdapter {
  // ===== WORKSPACES =====
  getWorkspace(id: string, userId: string): Promise<IWorkspace | null>;
  listWorkspaces(userId: string, limit?: number, offset?: number): Promise<IWorkspace[]>;
  createWorkspace(userId: string, data: Omit<IWorkspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<IWorkspace>;
  updateWorkspace(id: string, userId: string, data: Partial<Omit<IWorkspace, 'id' | 'user_id' | 'created_at'>>): Promise<IWorkspace>;
  deleteWorkspace(id: string, userId: string): Promise<void>;
  getDefaultWorkspace(userId: string): Promise<IWorkspace | null>;

  // ===== SESSIONS =====
  getSession(id: string, userId: string): Promise<ISession | null>;
  listSessions(userId: string, workspaceId?: string, limit?: number, offset?: number): Promise<ISession[]>;
  createSession(userId: string, data: Omit<ISession, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_accessed_at' | 'deleted_at'>): Promise<ISession>;
  updateSession(id: string, userId: string, data: Partial<Omit<ISession, 'id' | 'user_id' | 'created_at'>>): Promise<ISession>;
  deleteSession(id: string, userId: string): Promise<void>; // Soft delete
  updateLastAccessed(sessionId: string): Promise<void>;

  // ===== FILTER PRESETS =====
  getFilterPreset(id: string, userId: string): Promise<IFilterPreset | null>;
  listFilterPresets(userId: string, category?: string): Promise<IFilterPreset[]>;
  createFilterPreset(userId: string, data: Omit<IFilterPreset, 'id' | 'user_id' | 'use_count' | 'last_used_at' | 'created_at' | 'updated_at'>): Promise<IFilterPreset>;
  updateFilterPreset(id: string, userId: string, data: Partial<Omit<IFilterPreset, 'id' | 'user_id' | 'created_at'>>): Promise<IFilterPreset>;
  deleteFilterPreset(id: string, userId: string): Promise<void>;
  incrementFilterPresetUsage(id: string): Promise<void>;

  // ===== VIEWS =====
  getView(id: string, userId: string): Promise<IView | null>;
  getViewByPublicLink(publicLinkId: string): Promise<IView | null>;
  listViews(userId: string, workspaceId?: string, sessionId?: string, category?: string): Promise<IView[]>;
  createView(userId: string, data: Omit<IView, 'id' | 'user_id' | 'access_count' | 'created_at' | 'updated_at' | 'last_accessed_at'>): Promise<IView>;
  updateView(id: string, userId: string, data: Partial<Omit<IView, 'id' | 'user_id' | 'created_at'>>): Promise<IView>;
  deleteView(id: string, userId: string): Promise<void>;
  incrementViewAccessCount(id: string): Promise<void>;

  // ===== VIEW CHARTS =====
  getViewChart(id: string): Promise<IViewChart | null>;
  listViewCharts(viewId: string): Promise<IViewChart[]>;
  createViewChart(data: Omit<IViewChart, 'id' | 'created_at' | 'updated_at'>): Promise<IViewChart>;
  updateViewChart(id: string, data: Partial<Omit<IViewChart, 'id' | 'created_at'>>): Promise<IViewChart>;
  deleteViewChart(id: string): Promise<void>;
  reorderViewCharts(viewId: string, chartIds: string[]): Promise<void>;
  countViewCharts(viewId: string): Promise<number>;

  // ===== REPORTS (Future) =====
  getReport(id: string, userId: string): Promise<IReport | null>;
  listReports(userId: string, sessionId?: string): Promise<IReport[]>;
  createReport(userId: string, data: Omit<IReport, 'id' | 'user_id' | 'ai_credits_used' | 'created_at' | 'updated_at' | 'last_refreshed_at'>): Promise<IReport>;
  updateReport(id: string, userId: string, data: Partial<Omit<IReport, 'id' | 'user_id' | 'created_at'>>): Promise<IReport>;
  deleteReport(id: string, userId: string): Promise<void>;

  // ===== EXPORTS (Future) =====
  getExport(id: string, userId: string): Promise<IExport | null>;
  listExports(userId: string, sessionId?: string): Promise<IExport[]>;
  createExport(userId: string, data: Omit<IExport, 'id' | 'user_id' | 'download_count' | 'created_at'>): Promise<IExport>;
  deleteExport(id: string, userId: string): Promise<void>;
  deleteExpiredExports(): Promise<number>;

  // ===== ACTIVE VIEWS =====
  listActiveViews(sessionId: string, sheetName?: string | null): Promise<IActiveView[]>;
  activateView(sessionId: string, sheetName: string | null, viewId: string): Promise<IActiveView>;
  deactivateView(sessionId: string, sheetName: string | null, viewId: string): Promise<void>;
  isViewActive(sessionId: string, sheetName: string | null, viewId: string): Promise<boolean>;

  // ===== UTILITY =====
  close(): Promise<void>;
}

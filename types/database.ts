/**
 * Database type definitions
 */

export interface ISession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  original_file_name: string;
  original_file_hash: string;
  row_count: number;
  column_count: number;
  file_size: number;
  file_type: 'xlsx' | 'xls' | 'csv';
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

export interface IFilterPreset {
  id: string;
  name: string;
  description?: string;
  category: string;
  filter_config: string; // JSON string of IFilterConfig
  created_at: string;
  updated_at: string;
}

export interface IDatabase {
  // Sessions
  getSession(id: string): Promise<ISession | null>;
  createSession(data: Omit<ISession, 'id' | 'created_at' | 'updated_at'>): Promise<ISession>;
  updateSession(id: string, data: Partial<ISession>): Promise<ISession>;
  deleteSession(id: string): Promise<void>;
  listSessions(limit?: number, offset?: number): Promise<ISession[]>;

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

  // Filter Presets
  getFilterPreset(id: string): Promise<IFilterPreset | null>;
  getFilterPresetByName(name: string): Promise<IFilterPreset | null>;
  listFilterPresets(category?: string): Promise<IFilterPreset[]>;
  createFilterPreset(data: Omit<IFilterPreset, 'id' | 'created_at' | 'updated_at'>): Promise<IFilterPreset>;
  updateFilterPreset(id: string, data: Partial<Omit<IFilterPreset, 'id' | 'created_at'>>): Promise<IFilterPreset>;
  deleteFilterPreset(id: string): Promise<void>;
}

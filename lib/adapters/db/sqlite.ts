/**
 * SQLite Database Adapter (Development)
 *
 * Implementation of IDBAdapter using better-sqlite3
 * Used in development environment
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import {
  IDBAdapter,
  IWorkspace,
  ISession,
  IFilterPreset,
  IView,
  IViewChart,
  IReport,
  IExport,
  IActiveView,
  ISessionMetadata,
  IActiveFiltersState,
  IFilterConfig,
} from './interface';

export class SQLiteAdapter implements IDBAdapter {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize() {
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'lib/adapters/db/schema.sqlite.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
    }
  }

  // ============================================================================
  // WORKSPACES
  // ============================================================================

  async getWorkspace(id: string, userId: string): Promise<IWorkspace | null> {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as any;
    if (!row) return null;
    return this.deserializeWorkspace(row);
  }

  async listWorkspaces(userId: string, limit = 50, offset = 0): Promise<IWorkspace[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM workspaces
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(userId, limit, offset) as any[];
    return rows.map(row => this.deserializeWorkspace(row));
  }

  async createWorkspace(
    userId: string,
    data: Omit<IWorkspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<IWorkspace> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO workspaces (
        id, user_id, name, description, color, icon, is_default, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.name,
      data.description || null,
      data.color,
      data.icon,
      data.is_default ? 1 : 0,
      now,
      now
    );

    return this.getWorkspace(id, userId) as Promise<IWorkspace>;
  }

  async updateWorkspace(
    id: string,
    userId: string,
    data: Partial<Omit<IWorkspace, 'id' | 'user_id' | 'created_at'>>
  ): Promise<IWorkspace> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        if (key === 'is_default') {
          updates.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE workspaces SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);

    return this.getWorkspace(id, userId) as Promise<IWorkspace>;
  }

  async deleteWorkspace(id: string, userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM workspaces WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  }

  async getDefaultWorkspace(userId: string): Promise<IWorkspace | null> {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE user_id = ? AND is_default = 1 LIMIT 1');
    const row = stmt.get(userId) as any;
    if (!row) return null;
    return this.deserializeWorkspace(row);
  }

  // ============================================================================
  // SESSIONS
  // ============================================================================

  async getSession(id: string, userId: string): Promise<ISession | null> {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ? AND deleted_at IS NULL');
    const row = stmt.get(id, userId) as any;
    if (!row) return null;
    return this.deserializeSession(row);
  }

  async listSessions(
    userId: string,
    workspaceId?: string,
    limit = 50,
    offset = 0
  ): Promise<ISession[]> {
    let query = 'SELECT * FROM sessions WHERE user_id = ? AND deleted_at IS NULL';
    const params: any[] = [userId];

    if (workspaceId) {
      query += ' AND workspace_id = ?';
      params.push(workspaceId);
    }

    query += ' ORDER BY last_accessed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.deserializeSession(row));
  }

  async createSession(
    userId: string,
    data: Omit<ISession, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_accessed_at' | 'deleted_at'>
  ): Promise<ISession> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, workspace_id, user_id, name, original_file_name, file_type,
        file_size, file_hash, r2_path_original, r2_path_parquet,
        metadata, active_filters, created_at, updated_at, last_accessed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.workspace_id,
      userId,
      data.name,
      data.original_file_name,
      data.file_type,
      data.file_size,
      data.file_hash,
      data.r2_path_original,
      data.r2_path_parquet,
      JSON.stringify(data.metadata),
      data.active_filters ? JSON.stringify(data.active_filters) : null,
      now,
      now,
      now
    );

    return this.getSession(id, userId) as Promise<ISession>;
  }

  async updateSession(
    id: string,
    userId: string,
    data: Partial<Omit<ISession, 'id' | 'user_id' | 'created_at'>>
  ): Promise<ISession> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        if (key === 'metadata' || key === 'active_filters') {
          updates.push(`${key} = ?`);
          values.push(value ? JSON.stringify(value) : null);
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE sessions SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `);

    stmt.run(...values);

    return this.getSession(id, userId) as Promise<ISession>;
  }

  async deleteSession(id: string, userId: string): Promise<void> {
    // Soft delete
    const stmt = this.db.prepare(`
      UPDATE sessions SET deleted_at = ? WHERE id = ? AND user_id = ?
    `);
    stmt.run(new Date().toISOString(), id, userId);
  }

  async updateLastAccessed(sessionId: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE sessions SET last_accessed_at = ? WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), sessionId);
  }

  // ============================================================================
  // FILTER PRESETS
  // ============================================================================

  async getFilterPreset(id: string, userId: string): Promise<IFilterPreset | null> {
    const stmt = this.db.prepare('SELECT * FROM filter_presets WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as any;
    if (!row) return null;
    return this.deserializeFilterPreset(row);
  }

  async listFilterPresets(userId: string, category?: string): Promise<IFilterPreset[]> {
    let query = 'SELECT * FROM filter_presets WHERE user_id = ?';
    const params: any[] = [userId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY use_count DESC, created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.deserializeFilterPreset(row));
  }

  async createFilterPreset(
    userId: string,
    data: Omit<IFilterPreset, 'id' | 'user_id' | 'use_count' | 'last_used_at' | 'created_at' | 'updated_at'>
  ): Promise<IFilterPreset> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO filter_presets (
        id, user_id, name, description, category, filter_config,
        use_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.name,
      data.description || null,
      data.category,
      JSON.stringify(data.filter_config),
      0,
      now,
      now
    );

    return this.getFilterPreset(id, userId) as Promise<IFilterPreset>;
  }

  async updateFilterPreset(
    id: string,
    userId: string,
    data: Partial<Omit<IFilterPreset, 'id' | 'user_id' | 'created_at'>>
  ): Promise<IFilterPreset> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        if (key === 'filter_config') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE filter_presets SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);

    return this.getFilterPreset(id, userId) as Promise<IFilterPreset>;
  }

  async deleteFilterPreset(id: string, userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM filter_presets WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  }

  async incrementFilterPresetUsage(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE filter_presets
      SET use_count = use_count + 1, last_used_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  // ============================================================================
  // VIEWS - Stub implementations (to be implemented)
  // ============================================================================

  async getView(id: string, userId: string): Promise<IView | null> {
    const stmt = this.db.prepare('SELECT * FROM views WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as any;
    if (!row) return null;
    return this.deserializeView(row);
  }

  async getViewByPublicLink(publicLinkId: string): Promise<IView | null> {
    const stmt = this.db.prepare('SELECT * FROM views WHERE public_link_id = ? AND is_public = 1');
    const row = stmt.get(publicLinkId) as any;
    if (!row) return null;
    return this.deserializeView(row);
  }

  async listViews(userId: string, workspaceId?: string, sessionId?: string, category?: string): Promise<IView[]> {
    let query = `
      SELECT
        id, workspace_id, session_id, user_id, name, description, category,
        filter_config, view_type, snapshot_data, is_public, public_link_id,
        is_default, dashboard_layout, created_at, updated_at, last_accessed_at, access_count
      FROM views
      WHERE user_id = ?
    `;

    const params: any[] = [userId];

    if (workspaceId) {
      query += ' AND workspace_id = ?';
      params.push(workspaceId);
    }

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => ({
      id: row.id,
      workspace_id: row.workspace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      name: row.name,
      description: row.description || undefined,
      category: row.category,
      filter_config: row.filter_config ? JSON.parse(row.filter_config) : {},
      view_type: row.view_type,
      snapshot_data: row.snapshot_data ? JSON.parse(row.snapshot_data) : undefined,
      is_public: Boolean(row.is_public),
      public_link_id: row.public_link_id || undefined,
      is_default: Boolean(row.is_default),
      dashboard_layout: row.dashboard_layout ? JSON.parse(row.dashboard_layout) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_accessed_at: row.last_accessed_at || undefined,
      access_count: row.access_count,
    }));
  }

  async createView(userId: string, data: Omit<IView, 'id' | 'user_id' | 'access_count' | 'created_at' | 'updated_at' | 'last_accessed_at'>): Promise<IView> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO views (
        id, workspace_id, session_id, user_id, name, description, category,
        filter_config, view_type, snapshot_data, is_public, public_link_id,
        is_default, dashboard_layout, access_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.workspace_id,
      data.session_id,
      userId,
      data.name,
      data.description || null,
      data.category || 'Custom',
      JSON.stringify(data.filter_config),
      data.view_type || 'filters_only',
      data.snapshot_data ? JSON.stringify(data.snapshot_data) : null,
      data.is_public ? 1 : 0,
      data.public_link_id || null,
      data.is_default ? 1 : 0,
      data.dashboard_layout ? JSON.stringify(data.dashboard_layout) : null,
      0, // access_count
      now,
      now
    );

    return this.getView(id, userId) as Promise<IView>;
  }

  async updateView(id: string, userId: string, data: Partial<Omit<IView, 'id' | 'user_id' | 'created_at'>>): Promise<IView> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        if (key === 'filter_config' || key === 'snapshot_data' || key === 'dashboard_layout') {
          updates.push(`${key} = ?`);
          values.push(value ? JSON.stringify(value) : null);
        } else if (key === 'is_public' || key === 'is_default') {
          updates.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE views SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);

    return this.getView(id, userId) as Promise<IView>;
  }

  async deleteView(id: string, userId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM views WHERE id = ? AND user_id = ?');
    stmt.run(id, userId);
  }

  async incrementViewAccessCount(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE views
      SET access_count = access_count + 1, last_accessed_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  // ============================================================================
  // VIEW CHARTS - Stub implementations
  // ============================================================================

  async getViewChart(id: string): Promise<IViewChart | null> {
    const stmt = this.db.prepare('SELECT * FROM view_charts WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.deserializeViewChart(row);
  }

  async listViewCharts(viewId: string): Promise<IViewChart[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM view_charts
      WHERE view_id = ?
      ORDER BY position ASC, created_at ASC
    `);
    const rows = stmt.all(viewId) as any[];
    return rows.map(row => this.deserializeViewChart(row));
  }

  async createViewChart(data: Omit<IViewChart, 'id' | 'created_at' | 'updated_at'>): Promise<IViewChart> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO view_charts (
        id, view_id, title, chart_type, config, size, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.view_id,
      data.title,
      data.chart_type,
      JSON.stringify(data.config),
      data.size || 'medium',
      data.position || 0,
      now,
      now
    );

    return this.getViewChart(id) as Promise<IViewChart>;
  }

  async updateViewChart(id: string, data: Partial<Omit<IViewChart, 'id' | 'created_at'>>): Promise<IViewChart> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        if (key === 'config') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE view_charts SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getViewChart(id) as Promise<IViewChart>;
  }

  async deleteViewChart(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM view_charts WHERE id = ?');
    stmt.run(id);
  }

  async reorderViewCharts(viewId: string, chartIds: string[]): Promise<void> {
    // Use a transaction to update all positions atomically
    const updateStmt = this.db.prepare('UPDATE view_charts SET position = ? WHERE id = ? AND view_id = ?');

    const transaction = this.db.transaction((ids: string[]) => {
      ids.forEach((chartId, index) => {
        updateStmt.run(index, chartId, viewId);
      });
    });

    transaction(chartIds);
  }

  async countViewCharts(viewId: string): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM view_charts WHERE view_id = ?');
    const result = stmt.get(viewId) as any;
    return result.count || 0;
  }

  // ============================================================================
  // REPORTS - Stub implementations (future feature)
  // ============================================================================

  async getReport(id: string, userId: string): Promise<IReport | null> {
    throw new Error('Reports not yet implemented');
  }

  async listReports(userId: string, sessionId?: string): Promise<IReport[]> {
    throw new Error('Reports not yet implemented');
  }

  async createReport(userId: string, data: Omit<IReport, 'id' | 'user_id' | 'ai_credits_used' | 'created_at' | 'updated_at' | 'last_refreshed_at'>): Promise<IReport> {
    throw new Error('Reports not yet implemented');
  }

  async updateReport(id: string, userId: string, data: Partial<Omit<IReport, 'id' | 'user_id' | 'created_at'>>): Promise<IReport> {
    throw new Error('Reports not yet implemented');
  }

  async deleteReport(id: string, userId: string): Promise<void> {
    throw new Error('Reports not yet implemented');
  }

  // ============================================================================
  // EXPORTS - Stub implementations (future feature)
  // ============================================================================

  async getExport(id: string, userId: string): Promise<IExport | null> {
    throw new Error('Exports not yet implemented');
  }

  async listExports(userId: string, sessionId?: string): Promise<IExport[]> {
    throw new Error('Exports not yet implemented');
  }

  async createExport(userId: string, data: Omit<IExport, 'id' | 'user_id' | 'download_count' | 'created_at'>): Promise<IExport> {
    throw new Error('Exports not yet implemented');
  }

  async deleteExport(id: string, userId: string): Promise<void> {
    throw new Error('Exports not yet implemented');
  }

  async deleteExpiredExports(): Promise<number> {
    throw new Error('Exports not yet implemented');
  }

  // ============================================================================
  // ACTIVE VIEWS
  // ============================================================================

  async listActiveViews(sessionId: string, sheetName?: string | null): Promise<IActiveView[]> {
    let query = 'SELECT * FROM active_views WHERE session_id = ?';
    const params: any[] = [sessionId];

    if (sheetName !== undefined) {
      if (sheetName === null) {
        query += ' AND sheet_name IS NULL';
      } else {
        query += ' AND sheet_name = ?';
        params.push(sheetName);
      }
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as IActiveView[];
  }

  async activateView(sessionId: string, sheetName: string | null, viewId: string): Promise<IActiveView> {
    const id = nanoid();
    const now = new Date().toISOString();

    // Use INSERT OR IGNORE to avoid duplicates
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO active_views (id, session_id, sheet_name, view_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, sessionId, sheetName, viewId, now);

    // Return the created/existing record
    const getStmt = this.db.prepare(`
      SELECT * FROM active_views
      WHERE session_id = ? AND sheet_name ${sheetName === null ? 'IS NULL' : '= ?'} AND view_id = ?
    `);

    const result = sheetName === null
      ? getStmt.get(sessionId, viewId)
      : getStmt.get(sessionId, sheetName, viewId);

    return result as IActiveView;
  }

  async deactivateView(sessionId: string, sheetName: string | null, viewId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM active_views
      WHERE session_id = ? AND sheet_name ${sheetName === null ? 'IS NULL' : '= ?'} AND view_id = ?
    `);

    if (sheetName === null) {
      stmt.run(sessionId, viewId);
    } else {
      stmt.run(sessionId, sheetName, viewId);
    }
  }

  async isViewActive(sessionId: string, sheetName: string | null, viewId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM active_views
      WHERE session_id = ? AND sheet_name ${sheetName === null ? 'IS NULL' : '= ?'} AND view_id = ?
    `);

    const result: any = sheetName === null
      ? stmt.get(sessionId, viewId)
      : stmt.get(sessionId, sheetName, viewId);

    return result.count > 0;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  async close(): Promise<void> {
    this.db.close();
  }

  // ============================================================================
  // PRIVATE HELPERS - Deserialization
  // ============================================================================

  private deserializeWorkspace(row: any): IWorkspace {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      is_default: row.is_default === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private deserializeSession(row: any): ISession {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      name: row.name,
      original_file_name: row.original_file_name,
      file_type: row.file_type,
      file_size: row.file_size,
      file_hash: row.file_hash,
      r2_path_original: row.r2_path_original,
      r2_path_parquet: row.r2_path_parquet,
      metadata: row.metadata ? JSON.parse(row.metadata) : { sheets: [], totalRows: 0, totalColumns: 0 },
      active_filters: row.active_filters ? JSON.parse(row.active_filters) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_accessed_at: row.last_accessed_at,
      deleted_at: row.deleted_at || null,
    };
  }

  private deserializeFilterPreset(row: any): IFilterPreset {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      category: row.category,
      filter_config: row.filter_config ? JSON.parse(row.filter_config) : { filters: [], combinator: 'AND' },
      use_count: row.use_count,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private deserializeView(row: any): IView {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      session_id: row.session_id,
      user_id: row.user_id,
      name: row.name,
      description: row.description || undefined,
      category: row.category,
      filter_config: row.filter_config ? JSON.parse(row.filter_config) : {},
      view_type: row.view_type,
      snapshot_data: row.snapshot_data ? JSON.parse(row.snapshot_data) : undefined,
      is_public: Boolean(row.is_public),
      public_link_id: row.public_link_id || undefined,
      is_default: Boolean(row.is_default),
      dashboard_layout: row.dashboard_layout ? JSON.parse(row.dashboard_layout) : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_accessed_at: row.last_accessed_at || undefined,
      access_count: row.access_count,
    };
  }

  private deserializeViewChart(row: any): IViewChart {
    return {
      id: row.id,
      view_id: row.view_id,
      title: row.title,
      chart_type: row.chart_type,
      config: row.config ? JSON.parse(row.config) : {},
      size: row.size,
      position: row.position,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

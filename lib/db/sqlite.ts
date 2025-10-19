import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { IDatabase, IWorkspace, ISession, IFile, ISavedFilter, ICachedResult, IView } from '@/types';
import fs from 'fs';
import path from 'path';

export class SQLiteDB implements IDatabase {
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
    const schemaPath = path.join(process.cwd(), 'lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }

  // Workspaces
  async getWorkspace(id: string): Promise<IWorkspace | null> {
    const stmt = this.db.prepare('SELECT * FROM workspaces WHERE id = ?');
    return (stmt.get(id) as IWorkspace) || null;
  }

  async createWorkspace(data: Omit<IWorkspace, 'id' | 'created_at' | 'updated_at'>): Promise<IWorkspace> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO workspaces (
        id, name, description, created_at, updated_at, color, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.description || null,
      now,
      now,
      data.color,
      data.icon
    );

    return this.getWorkspace(id) as Promise<IWorkspace>;
  }

  async updateWorkspace(id: string, data: Partial<Omit<IWorkspace, 'id' | 'created_at'>>): Promise<IWorkspace> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.getWorkspace(id) as Promise<IWorkspace>;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM workspaces WHERE id = ?');
    stmt.run(id);
  }

  async listWorkspaces(limit = 50, offset = 0): Promise<IWorkspace[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM workspaces
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as IWorkspace[];
  }

  // Sessions
  async getSession(id: string): Promise<ISession | null> {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return (stmt.get(id) as ISession) || null;
  }

  async createSession(data: Omit<ISession, 'id' | 'created_at' | 'updated_at'>): Promise<ISession> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, workspace_id, name, created_at, updated_at, original_file_name,
        original_file_hash, row_count, column_count, file_size, file_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.workspace_id,
      data.name,
      now,
      now,
      data.original_file_name,
      data.original_file_hash,
      data.row_count,
      data.column_count,
      data.file_size,
      data.file_type
    );

    return this.getSession(id) as Promise<ISession>;
  }

  async updateSession(id: string, data: Partial<ISession>): Promise<ISession> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE sessions SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.getSession(id) as Promise<ISession>;
  }

  async deleteSession(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  async listSessions(limit = 50, offset = 0): Promise<ISession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as ISession[];
  }

  async listSessionsByWorkspace(workspaceId: string, limit = 50, offset = 0): Promise<ISession[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      WHERE workspace_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(workspaceId, limit, offset) as ISession[];
  }

  // Files
  async getFile(id: string): Promise<IFile | null> {
    const stmt = this.db.prepare('SELECT * FROM files WHERE id = ?');
    return (stmt.get(id) as IFile) || null;
  }

  async getFileBySession(sessionId: string): Promise<IFile | null> {
    const stmt = this.db.prepare('SELECT * FROM files WHERE session_id = ?');
    return (stmt.get(sessionId) as IFile) || null;
  }

  async createFile(data: Omit<IFile, 'id' | 'uploaded_at'>): Promise<IFile> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO files (
        id, session_id, file_type, storage_type, storage_path, file_data, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.session_id,
      data.file_type,
      data.storage_type,
      data.storage_path,
      data.file_data || null,
      now
    );

    return this.getFile(id) as Promise<IFile>;
  }

  async deleteFile(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(id);
  }

  // Saved Filters
  async getSavedFilter(id: string): Promise<ISavedFilter | null> {
    const stmt = this.db.prepare('SELECT * FROM saved_filters WHERE id = ?');
    return (stmt.get(id) as ISavedFilter) || null;
  }

  async listSavedFilters(sessionId: string): Promise<ISavedFilter[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM saved_filters
      WHERE session_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(sessionId) as ISavedFilter[];
  }

  async createSavedFilter(data: Omit<ISavedFilter, 'id' | 'created_at'>): Promise<ISavedFilter> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO saved_filters (
        id, session_id, name, description, filter_config, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.session_id,
      data.name,
      data.description || null,
      data.filter_config,
      now
    );

    return this.getSavedFilter(id) as Promise<ISavedFilter>;
  }

  async deleteSavedFilter(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM saved_filters WHERE id = ?');
    stmt.run(id);
  }

  // Cached Results
  async getCachedResult(sessionId: string, filterHash: string): Promise<ICachedResult | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM cached_results
      WHERE session_id = ? AND filter_hash = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);
    return (stmt.get(sessionId, filterHash) as ICachedResult) || null;
  }

  async createCachedResult(data: Omit<ICachedResult, 'id' | 'created_at'>): Promise<ICachedResult> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO cached_results (
        id, session_id, filter_hash, result_count, result_data, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.session_id,
      data.filter_hash,
      data.result_count,
      data.result_data,
      now,
      data.expires_at || null
    );

    return this.getCachedResult(data.session_id, data.filter_hash) as Promise<ICachedResult>;
  }

  async deleteCachedResult(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM cached_results WHERE id = ?');
    stmt.run(id);
  }

  async deleteExpiredCache(): Promise<number> {
    const stmt = this.db.prepare(`
      DELETE FROM cached_results
      WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
  }

  // Views (formerly Filter Presets)
  async getView(id: string): Promise<IView | null> {
    const stmt = this.db.prepare('SELECT * FROM views WHERE id = ?');
    return (stmt.get(id) as IView) || null;
  }

  async getViewByName(name: string): Promise<IView | null> {
    const stmt = this.db.prepare('SELECT * FROM views WHERE name = ?');
    return (stmt.get(name) as IView) || null;
  }

  async getViewByPublicLink(publicLinkId: string): Promise<IView | null> {
    const stmt = this.db.prepare('SELECT * FROM views WHERE public_link_id = ? AND is_public = true');
    return (stmt.get(publicLinkId) as IView) || null;
  }

  async listViews(sessionId?: string, category?: string): Promise<IView[]> {
    let query = 'SELECT * FROM views WHERE 1=1';
    const params: any[] = [];

    if (sessionId) {
      query += ' AND (session_id = ? OR session_id IS NULL)';
      params.push(sessionId);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category ASC, name ASC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as IView[];
  }

  async createView(data: Omit<IView, 'id' | 'created_at' | 'updated_at' | 'access_count'>): Promise<IView> {
    const id = nanoid();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO views (
        id, name, description, category, session_id, filter_config, view_type,
        snapshot_data, is_public, public_link_id, created_at, updated_at, access_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.category,
      data.session_id || null,
      data.filter_config,
      data.view_type,
      data.snapshot_data || null,
      data.is_public ? 1 : 0,
      data.public_link_id || null,
      now,
      now
    );

    return this.getView(id) as Promise<IView>;
  }

  async updateView(id: string, data: Partial<Omit<IView, 'id' | 'created_at'>>): Promise<IView> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'access_count') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE views SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.getView(id) as Promise<IView>;
  }

  async deleteView(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM views WHERE id = ?');
    stmt.run(id);
  }

  async incrementViewAccessCount(id: string): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE views
      SET access_count = access_count + 1, last_accessed_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  }

  // Backward compatibility aliases
  async getFilterPreset(id: string): Promise<IView | null> {
    return this.getView(id);
  }

  async getFilterPresetByName(name: string): Promise<IView | null> {
    return this.getViewByName(name);
  }

  async listFilterPresets(category?: string): Promise<IView[]> {
    return this.listViews(undefined, category);
  }

  async createFilterPreset(data: Omit<IView, 'id' | 'created_at' | 'updated_at' | 'access_count'>): Promise<IView> {
    return this.createView(data);
  }

  async updateFilterPreset(id: string, data: Partial<Omit<IView, 'id' | 'created_at'>>): Promise<IView> {
    return this.updateView(id, data);
  }

  async deleteFilterPreset(id: string): Promise<void> {
    return this.deleteView(id);
  }

  close() {
    this.db.close();
  }
}

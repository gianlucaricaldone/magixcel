import { IDatabase, IWorkspace, ISession, IFile, ISavedFilter, ICachedResult, IView } from '@/types';

/**
 * Supabase implementation (stub for future use)
 *
 * This will be implemented when migrating to production.
 * For now, it's a placeholder to maintain the database-agnostic architecture.
 */

export class SupabaseDB implements IDatabase {
  constructor() {
    throw new Error('Supabase implementation not yet available. Use SQLite for development.');
  }

  // Workspaces
  async getWorkspace(id: string): Promise<IWorkspace | null> {
    throw new Error('Not implemented');
  }

  async createWorkspace(data: Omit<IWorkspace, 'id' | 'created_at' | 'updated_at'>): Promise<IWorkspace> {
    throw new Error('Not implemented');
  }

  async updateWorkspace(id: string, data: Partial<Omit<IWorkspace, 'id' | 'created_at'>>): Promise<IWorkspace> {
    throw new Error('Not implemented');
  }

  async deleteWorkspace(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async listWorkspaces(limit?: number, offset?: number): Promise<IWorkspace[]> {
    throw new Error('Not implemented');
  }

  // Sessions
  async getSession(id: string): Promise<ISession | null> {
    throw new Error('Not implemented');
  }

  async createSession(data: Omit<ISession, 'id' | 'created_at' | 'updated_at'>): Promise<ISession> {
    throw new Error('Not implemented');
  }

  async updateSession(id: string, data: Partial<ISession>): Promise<ISession> {
    throw new Error('Not implemented');
  }

  async deleteSession(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async listSessions(limit?: number, offset?: number): Promise<ISession[]> {
    throw new Error('Not implemented');
  }

  async listSessionsByWorkspace(workspaceId: string, limit?: number, offset?: number): Promise<ISession[]> {
    throw new Error('Not implemented');
  }

  async getFile(id: string): Promise<IFile | null> {
    throw new Error('Not implemented');
  }

  async getFileBySession(sessionId: string): Promise<IFile | null> {
    throw new Error('Not implemented');
  }

  async createFile(data: Omit<IFile, 'id' | 'uploaded_at'>): Promise<IFile> {
    throw new Error('Not implemented');
  }

  async deleteFile(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getSavedFilter(id: string): Promise<ISavedFilter | null> {
    throw new Error('Not implemented');
  }

  async listSavedFilters(sessionId: string): Promise<ISavedFilter[]> {
    throw new Error('Not implemented');
  }

  async createSavedFilter(data: Omit<ISavedFilter, 'id' | 'created_at'>): Promise<ISavedFilter> {
    throw new Error('Not implemented');
  }

  async deleteSavedFilter(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getCachedResult(sessionId: string, filterHash: string): Promise<ICachedResult | null> {
    throw new Error('Not implemented');
  }

  async createCachedResult(data: Omit<ICachedResult, 'id' | 'created_at'>): Promise<ICachedResult> {
    throw new Error('Not implemented');
  }

  async deleteCachedResult(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async deleteExpiredCache(): Promise<number> {
    throw new Error('Not implemented');
  }

  // Views (formerly Filter Presets)
  async getView(id: string): Promise<IView | null> {
    throw new Error('Not implemented');
  }

  async getViewByName(name: string): Promise<IView | null> {
    throw new Error('Not implemented');
  }

  async getViewByPublicLink(publicLinkId: string): Promise<IView | null> {
    throw new Error('Not implemented');
  }

  async listViews(sessionId?: string, category?: string): Promise<IView[]> {
    throw new Error('Not implemented');
  }

  async createView(data: Omit<IView, 'id' | 'created_at' | 'updated_at' | 'access_count'>): Promise<IView> {
    throw new Error('Not implemented');
  }

  async updateView(id: string, data: Partial<Omit<IView, 'id' | 'created_at'>>): Promise<IView> {
    throw new Error('Not implemented');
  }

  async deleteView(id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async incrementViewAccessCount(id: string): Promise<void> {
    throw new Error('Not implemented');
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
}

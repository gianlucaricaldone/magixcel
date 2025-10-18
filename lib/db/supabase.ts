import { IDatabase, ISession, IFile, ISavedFilter, ICachedResult, IFilterPreset } from '@/types';

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

  async getFilterPreset(id: string): Promise<IFilterPreset | null> {
    throw new Error('Not implemented');
  }

  async getFilterPresetByName(name: string): Promise<IFilterPreset | null> {
    throw new Error('Not implemented');
  }

  async listFilterPresets(category?: string): Promise<IFilterPreset[]> {
    throw new Error('Not implemented');
  }

  async createFilterPreset(data: Omit<IFilterPreset, 'id' | 'created_at' | 'updated_at'>): Promise<IFilterPreset> {
    throw new Error('Not implemented');
  }

  async updateFilterPreset(id: string, data: Partial<Omit<IFilterPreset, 'id' | 'created_at'>>): Promise<IFilterPreset> {
    throw new Error('Not implemented');
  }

  async deleteFilterPreset(id: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

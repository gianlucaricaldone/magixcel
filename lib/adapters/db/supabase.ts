/**
 * Supabase Database Adapter (Production)
 *
 * Implementation of IDBAdapter using Supabase PostgreSQL
 * Used in production environment
 *
 * TODO: Implement when moving to production
 */

import { IDBAdapter } from './interface';

export class SupabaseAdapter implements IDBAdapter {
  constructor() {
    // TODO: Initialize Supabase client
    throw new Error('Supabase adapter not yet implemented. Use SQLite for development.');
  }

  // All methods throw "not implemented" error
  // Will be implemented when production setup is ready

  async getWorkspace(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listWorkspaces(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createWorkspace(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateWorkspace(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteWorkspace(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getDefaultWorkspace(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getSession(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listSessions(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createSession(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateSession(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteSession(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateLastAccessed(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getFilterPreset(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listFilterPresets(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createFilterPreset(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateFilterPreset(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteFilterPreset(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async incrementFilterPresetUsage(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getView(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getViewByPublicLink(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listViews(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createView(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateView(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteView(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async incrementViewAccessCount(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getViewChart(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listViewCharts(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createViewChart(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateViewChart(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteViewChart(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async reorderViewCharts(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async countViewCharts(): Promise<number> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getReport(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listReports(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createReport(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async updateReport(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteReport(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async getExport(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async listExports(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async createExport(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteExport(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deleteExpiredExports(): Promise<number> {
    throw new Error('Supabase adapter not yet implemented');
  }

  // ===== ACTIVE VIEWS =====

  async listActiveViews(): Promise<any[]> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async activateView(): Promise<any> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async deactivateView(): Promise<void> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async isViewActive(): Promise<boolean> {
    throw new Error('Supabase adapter not yet implemented');
  }

  async close(): Promise<void> {
    // No-op for Supabase (connection pooling handled by client)
  }
}

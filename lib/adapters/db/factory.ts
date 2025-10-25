/**
 * Database Adapter Factory
 *
 * Returns the appropriate database adapter based on environment configuration
 */

import { IDBAdapter } from './interface';
import { SQLiteAdapter } from './sqlite';
import { SupabaseAdapter } from './supabase';
import path from 'path';

let dbInstance: IDBAdapter | null = null;

/**
 * Get database adapter instance (singleton)
 *
 * Environment variables:
 * - DB_PROVIDER: 'sqlite' | 'supabase'
 * - SQLITE_DB_PATH: Path to SQLite database file (default: ./data/magixcel.db)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase service role key
 */
export function getDBAdapter(): IDBAdapter {
  if (dbInstance) {
    return dbInstance;
  }

  const provider = process.env.DB_PROVIDER || 'sqlite';

  switch (provider) {
    case 'sqlite':
      const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'magixcel.db');
      console.log(`[DB] Using SQLite adapter: ${dbPath}`);
      dbInstance = new SQLiteAdapter(dbPath);
      break;

    case 'supabase':
      console.log('[DB] Using Supabase adapter');
      dbInstance = new SupabaseAdapter();
      break;

    default:
      throw new Error(`Unknown DB provider: ${provider}. Must be 'sqlite' or 'supabase'`);
  }

  return dbInstance;
}

/**
 * Close database connection (call on shutdown)
 */
export async function closeDBAdapter(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Get current user ID
 * In development: returns 'dev-user'
 * In production: returns authenticated user ID from session
 */
export function getCurrentUserId(): string {
  // TODO: In production, get from Supabase Auth session
  // For now, return dev user
  return process.env.DEV_USER_ID || 'dev-user';
}

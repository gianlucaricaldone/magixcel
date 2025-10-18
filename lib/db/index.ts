import { IDatabase } from '@/types';
import { SQLiteDB } from './sqlite';
import { SupabaseDB } from './supabase';
import path from 'path';

/**
 * Database abstraction layer
 *
 * This module provides a unified interface to the database,
 * allowing seamless switching between SQLite (development) and Supabase (production).
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const session = await db.getSession(id);
 */

let dbInstance: IDatabase | null = null;

function getDatabase(): IDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  if (dbType === 'supabase') {
    dbInstance = new SupabaseDB();
  } else {
    // SQLite
    const dbUrl = process.env.DATABASE_URL || 'file:./data/magixcel.db';
    const dbPath = dbUrl.replace('file:', '');
    const absolutePath = path.isAbsolute(dbPath)
      ? dbPath
      : path.join(process.cwd(), dbPath);

    dbInstance = new SQLiteDB(absolutePath);
  }

  return dbInstance;
}

export const db = getDatabase();

// Export types and classes for testing
export type { IDatabase };
export { SQLiteDB, SupabaseDB };

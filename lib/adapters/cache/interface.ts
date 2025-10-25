/**
 * Cache Adapter Interface
 *
 * Abstract interface for caching operations
 * Implementations: Memory (dev), Redis/Vercel KV (prod)
 */

export interface ICacheAdapter {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Value if exists, null otherwise
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Delete value from cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns true if exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all cache (use with caution!)
   */
  clear(): Promise<void>;

  /**
   * Delete keys matching pattern
   * @param pattern - Pattern to match (e.g., "session:*")
   * @returns Number of keys deleted
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Get multiple values at once
   * @param keys - Array of cache keys
   * @returns Array of values (null for missing keys)
   */
  getMany<T = any>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple values at once
   * @param entries - Array of [key, value] pairs
   * @param ttl - Time to live in seconds (optional)
   */
  setMany(entries: [string, any][], ttl?: number): Promise<void>;
}

/**
 * Cache key generators
 */
export class CacheKeys {
  /**
   * Cache key for filter query results
   * @param sessionId - Session ID
   * @param filterHash - Hash of filter config
   * @param page - Page number
   */
  static filterQuery(sessionId: string, filterHash: string, page: number): string {
    return `filter:${sessionId}:${filterHash}:${page}`;
  }

  /**
   * Cache key for session metadata
   * @param sessionId - Session ID
   */
  static sessionMetadata(sessionId: string): string {
    return `session:${sessionId}`;
  }

  /**
   * Cache key for user profile
   * @param userId - User ID
   */
  static userProfile(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Cache key for workspace
   * @param workspaceId - Workspace ID
   */
  static workspace(workspaceId: string): string {
    return `workspace:${workspaceId}`;
  }

  /**
   * Pattern for all session caches
   * @param sessionId - Session ID
   */
  static sessionPattern(sessionId: string): string {
    return `*:${sessionId}:*`;
  }
}

/**
 * Default TTL values (in seconds)
 */
export const DEFAULT_CACHE_TTL = {
  FILTER_QUERY: 3600,      // 1 hour
  SESSION_METADATA: 86400, // 24 hours
  USER_PROFILE: 604800,    // 7 days
  WORKSPACE: 86400,        // 24 hours
};

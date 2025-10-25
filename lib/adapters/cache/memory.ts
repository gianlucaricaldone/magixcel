/**
 * In-Memory Cache Adapter (Development)
 *
 * Simple in-memory cache implementation
 * Note: Cache is lost on server restart
 */

import { ICacheAdapter } from './interface';

interface ICacheEntry {
  value: any;
  expiresAt?: number;
}

export class MemoryCacheAdapter implements ICacheAdapter {
  private cache: Map<string, ICacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    console.log('[Cache] Using Memory adapter');

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const entry: ICacheEntry = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async deletePattern(pattern: string): Promise<number> {
    // Convert glob pattern to regex
    const regex = this.globToRegex(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async setMany(entries: [string, any][], ttl?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Convert glob pattern to regex
   * @param pattern - Glob pattern (e.g., "session:*")
   * @returns RegExp
   */
  private globToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Convert glob wildcards to regex
    const regexPattern = escaped
      .replace(/\*/g, '.*')  // * matches any characters
      .replace(/\?/g, '.');  // ? matches single character

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Get cache stats (useful for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Destroy cache adapter (cleanup)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

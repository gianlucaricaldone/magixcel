/**
 * Cache Adapter Factory
 *
 * Returns the appropriate cache adapter based on environment configuration
 */

import { ICacheAdapter } from './interface';
import { MemoryCacheAdapter } from './memory';
import { RedisCacheAdapter } from './redis';

let cacheInstance: ICacheAdapter | null = null;

/**
 * Get cache adapter instance (singleton)
 *
 * Environment variables:
 * - CACHE_PROVIDER: 'memory' | 'redis'
 * - KV_REST_API_URL: Vercel KV REST API URL (for redis)
 * - KV_REST_API_TOKEN: Vercel KV REST API token (for redis)
 */
export function getCacheAdapter(): ICacheAdapter {
  if (cacheInstance) {
    return cacheInstance;
  }

  const provider = process.env.CACHE_PROVIDER || 'memory';

  switch (provider) {
    case 'memory':
      console.log('[Cache] Using Memory adapter');
      cacheInstance = new MemoryCacheAdapter();
      break;

    case 'redis':
      console.log('[Cache] Using Redis adapter (Vercel KV)');
      cacheInstance = new RedisCacheAdapter();
      break;

    default:
      throw new Error(`Unknown cache provider: ${provider}. Must be 'memory' or 'redis'`);
  }

  return cacheInstance;
}

/**
 * Close cache adapter (call on shutdown)
 */
export async function closeCacheAdapter(): Promise<void> {
  if (cacheInstance) {
    if ('destroy' in cacheInstance && typeof cacheInstance.destroy === 'function') {
      (cacheInstance as any).destroy();
    }
    cacheInstance = null;
  }
}

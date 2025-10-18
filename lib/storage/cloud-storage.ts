import { IStorageProvider } from './types';

/**
 * Cloud storage implementation (Cloudflare R2 / S3)
 *
 * This is a stub for future implementation.
 * Will be implemented when migrating to production.
 */
export class CloudStorage implements IStorageProvider {
  constructor() {
    throw new Error('Cloud storage not yet implemented. Use local storage for development.');
  }

  async save(sessionId: string, fileName: string, data: Buffer): Promise<string> {
    throw new Error('Not implemented');
  }

  async get(path: string): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  async delete(path: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async exists(path: string): Promise<boolean> {
    throw new Error('Not implemented');
  }

  getUrl(path: string): string {
    throw new Error('Not implemented');
  }
}

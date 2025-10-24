/**
 * Cloudflare R2 Storage Adapter (Production)
 *
 * Stores files on Cloudflare R2 (S3-compatible)
 *
 * TODO: Implement when moving to production
 */

import { IStorageAdapter, IR2StorageConfig } from './interface';

export class R2StorageAdapter implements IStorageAdapter {
  constructor(config: IR2StorageConfig) {
    // TODO: Initialize AWS S3 client for R2
    // const s3 = new S3Client({
    //   region: 'auto',
    //   endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    //   credentials: {
    //     accessKeyId: config.accessKeyId,
    //     secretAccessKey: config.secretAccessKey,
    //   },
    // });

    throw new Error('R2 adapter not yet implemented. Use Local storage for development.');
  }

  async upload(): Promise<string> {
    throw new Error('R2 adapter not yet implemented');
  }

  async download(): Promise<Buffer> {
    throw new Error('R2 adapter not yet implemented');
  }

  async getStream(): Promise<NodeJS.ReadableStream> {
    throw new Error('R2 adapter not yet implemented');
  }

  async delete(): Promise<void> {
    throw new Error('R2 adapter not yet implemented');
  }

  async exists(): Promise<boolean> {
    throw new Error('R2 adapter not yet implemented');
  }

  async getMetadata(): Promise<any> {
    throw new Error('R2 adapter not yet implemented');
  }

  async list(): Promise<string[]> {
    throw new Error('R2 adapter not yet implemented');
  }

  async getPublicUrl(): Promise<string> {
    throw new Error('R2 adapter not yet implemented');
  }
}

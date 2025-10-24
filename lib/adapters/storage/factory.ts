/**
 * Storage Adapter Factory
 *
 * Returns the appropriate storage adapter based on environment configuration
 */

import { IStorageAdapter } from './interface';
import { LocalStorageAdapter } from './local';
import { R2StorageAdapter } from './r2';
import path from 'path';

let storageInstance: IStorageAdapter | null = null;

/**
 * Get storage adapter instance (singleton)
 *
 * Environment variables:
 * - STORAGE_PROVIDER: 'local' | 'r2'
 * - LOCAL_STORAGE_PATH: Path to local storage directory (default: ./data/files)
 * - R2_ACCOUNT_ID: Cloudflare R2 account ID
 * - R2_ACCESS_KEY_ID: R2 access key
 * - R2_SECRET_ACCESS_KEY: R2 secret key
 * - R2_BUCKET_NAME: R2 bucket name
 * - R2_PUBLIC_URL: Custom domain for public URLs (optional)
 */
export function getStorageAdapter(): IStorageAdapter {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = process.env.STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      const basePath = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data', 'files');
      console.log(`[Storage] Using Local adapter: ${basePath}`);
      storageInstance = new LocalStorageAdapter({ basePath });
      break;

    case 'r2':
      console.log('[Storage] Using R2 adapter');
      storageInstance = new R2StorageAdapter({
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucketName: process.env.R2_BUCKET_NAME!,
        publicUrl: process.env.R2_PUBLIC_URL,
      });
      break;

    default:
      throw new Error(`Unknown storage provider: ${provider}. Must be 'local' or 'r2'`);
  }

  return storageInstance;
}

/**
 * Get full storage path for a session
 * @param sessionId - Session ID
 * @param filename - Filename (e.g., "original.xlsx" or "data.parquet")
 * @returns Relative storage path (relative to basePath, not including 'files/')
 */
export function getSessionFilePath(sessionId: string, filename: string): string {
  return `${sessionId}/${filename}`;
}

/**
 * Get full storage path for an export
 * @param sessionId - Session ID
 * @param exportId - Export ID
 * @param format - Export format
 * @returns Relative storage path
 */
export function getExportFilePath(sessionId: string, exportId: string, format: string): string {
  return `exports/${sessionId}/${exportId}.${format}`;
}

/**
 * Get full storage path for a report
 * @param reportId - Report ID
 * @param type - Report type ('html' or 'ppt')
 * @returns Relative storage path
 */
export function getReportFilePath(reportId: string, type: 'html' | 'ppt'): string {
  const extension = type === 'html' ? 'html' : 'pptx';
  return `reports/${reportId}/report.${extension}`;
}

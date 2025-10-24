/**
 * Storage Adapter Interface
 *
 * Abstract interface for file storage operations
 * Implementations: Local (dev), Cloudflare R2 (prod)
 */

export interface IStorageAdapter {
  /**
   * Upload file to storage
   * @param path - Relative path (e.g., "files/abc123/original.xlsx")
   * @param data - File data (Buffer or ReadableStream)
   * @param contentType - MIME type
   * @returns Full storage URL
   */
  upload(path: string, data: Buffer | NodeJS.ReadableStream, contentType?: string): Promise<string>;

  /**
   * Download file from storage
   * @param path - Relative path
   * @returns File data as Buffer
   */
  download(path: string): Promise<Buffer>;

  /**
   * Get readable stream for file (for DuckDB streaming)
   * @param path - Relative path
   * @returns ReadableStream
   */
  getStream(path: string): Promise<NodeJS.ReadableStream>;

  /**
   * Delete file from storage
   * @param path - Relative path
   */
  delete(path: string): Promise<void>;

  /**
   * Check if file exists
   * @param path - Relative path
   * @returns true if exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file metadata
   * @param path - Relative path
   * @returns Metadata (size, contentType, lastModified)
   */
  getMetadata(path: string): Promise<IFileMetadata>;

  /**
   * List files in a directory
   * @param prefix - Directory prefix (e.g., "files/abc123/")
   * @returns Array of file paths
   */
  list(prefix: string): Promise<string[]>;

  /**
   * Get public URL for file (if supported)
   * @param path - Relative path
   * @param expiresIn - Expiration time in seconds (for signed URLs)
   * @returns Public/signed URL
   */
  getPublicUrl(path: string, expiresIn?: number): Promise<string>;
}

export interface IFileMetadata {
  size: number;
  contentType: string;
  lastModified: Date;
  etag?: string;
}

/**
 * Storage configuration types
 */
export interface ILocalStorageConfig {
  basePath: string; // e.g., "./data/files"
}

export interface IR2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string; // Custom domain
}

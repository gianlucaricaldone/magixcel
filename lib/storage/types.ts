/**
 * Storage provider interface
 */

export interface IStorageProvider {
  /**
   * Save a file
   */
  save(sessionId: string, fileName: string, data: Buffer): Promise<string>;

  /**
   * Retrieve a file
   */
  get(path: string): Promise<Buffer>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file URL (for cloud storage)
   */
  getUrl?(path: string): string;
}

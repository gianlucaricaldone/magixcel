import fs from 'fs/promises';
import path from 'path';
import { IStorageProvider } from './types';
import { STORAGE_PATH } from '@/lib/utils/constants';

/**
 * Local filesystem storage implementation
 */
export class LocalStorage implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string = STORAGE_PATH) {
    this.basePath = basePath;
  }

  async save(sessionId: string, fileName: string, data: Buffer): Promise<string> {
    const sessionDir = path.join(this.basePath, sessionId);

    // Create directory if it doesn't exist
    await fs.mkdir(sessionDir, { recursive: true });

    const filePath = path.join(sessionDir, fileName);
    await fs.writeFile(filePath, data);

    // Return relative path
    return path.relative(this.basePath, filePath);
  }

  async get(relativePath: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, relativePath);
    return await fs.readFile(filePath);
  }

  async delete(relativePath: string): Promise<void> {
    const filePath = path.join(this.basePath, relativePath);
    await fs.unlink(filePath);

    // Try to remove empty session directory
    const sessionDir = path.dirname(filePath);
    try {
      const files = await fs.readdir(sessionDir);
      if (files.length === 0) {
        await fs.rmdir(sessionDir);
      }
    } catch (error) {
      // Ignore errors when removing directory
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const filePath = path.join(this.basePath, relativePath);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

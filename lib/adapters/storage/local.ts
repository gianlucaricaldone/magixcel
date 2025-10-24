/**
 * Local File System Storage Adapter (Development)
 *
 * Stores files on local filesystem
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { IStorageAdapter, IFileMetadata, ILocalStorageConfig } from './interface';

export class LocalStorageAdapter implements IStorageAdapter {
  private basePath: string;

  constructor(config: ILocalStorageConfig) {
    this.basePath = config.basePath;

    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    console.log(`[Storage] Using Local adapter: ${this.basePath}`);
  }

  async upload(
    relativePath: string,
    data: Buffer | NodeJS.ReadableStream,
    contentType?: string
  ): Promise<string> {
    const fullPath = path.join(this.basePath, relativePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }

    // Write file
    if (Buffer.isBuffer(data)) {
      await fsp.writeFile(fullPath, data);
    } else {
      // Stream to file
      const writeStream = fs.createWriteStream(fullPath);
      await new Promise<void>((resolve, reject) => {
        (data as Readable).pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
    }

    // Store content type in metadata file (optional)
    if (contentType) {
      const metaPath = `${fullPath}.meta.json`;
      await fsp.writeFile(
        metaPath,
        JSON.stringify({ contentType, uploadedAt: new Date().toISOString() })
      );
    }

    // Return "local://" URL
    return `local://${relativePath}`;
  }

  async download(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    return await fsp.readFile(fullPath);
  }

  async getStream(relativePath: string): Promise<NodeJS.ReadableStream> {
    const fullPath = path.join(this.basePath, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    return fs.createReadStream(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, relativePath);

    if (fs.existsSync(fullPath)) {
      await fsp.unlink(fullPath);

      // Delete metadata file if exists
      const metaPath = `${fullPath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        await fsp.unlink(metaPath);
      }
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, relativePath);
    return fs.existsSync(fullPath);
  }

  async getMetadata(relativePath: string): Promise<IFileMetadata> {
    const fullPath = path.join(this.basePath, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }

    const stats = await fsp.stat(fullPath);

    // Try to read content type from metadata file
    let contentType = 'application/octet-stream';
    const metaPath = `${fullPath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await fsp.readFile(metaPath, 'utf-8'));
        contentType = meta.contentType || contentType;
      } catch (e) {
        // Ignore metadata read errors
      }
    }

    return {
      size: stats.size,
      contentType,
      lastModified: stats.mtime,
    };
  }

  async list(prefix: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, prefix);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const files: string[] = [];

    const walk = async (dir: string) => {
      const entries = await fsp.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullEntryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullEntryPath);
        } else if (entry.isFile() && !entry.name.endsWith('.meta.json')) {
          // Return relative path from basePath
          const relativePath = path.relative(this.basePath, fullEntryPath);
          files.push(relativePath);
        }
      }
    };

    await walk(fullPath);
    return files;
  }

  async getPublicUrl(relativePath: string, expiresIn?: number): Promise<string> {
    // For local storage, return a "local://" URL
    // In a real app, this might be served via HTTP on localhost
    return `local://${relativePath}`;
  }

  /**
   * Get absolute filesystem path (for DuckDB to read directly)
   * This is a helper specific to LocalStorageAdapter
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.basePath, relativePath);
  }
}

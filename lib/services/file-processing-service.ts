/**
 * File Processing Service
 *
 * Shared logic for uploading and replacing session files.
 * Ensures consistent processing pipeline:
 * 1. Temp file save
 * 2. Parquet conversion (DuckDB)
 * 3. Storage upload (R2/Local)
 * 4. Database update
 * 5. Cleanup
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { nanoid } from 'nanoid';
import { createParquetConverter } from '@/lib/processing/parquet-converter';
import { sanitizeFilename } from '@/lib/utils/validators';
import type { IStorageAdapter } from '@/lib/adapters/storage/interface';
import type { IDBAdapter } from '@/lib/adapters/db/interface';
import { getSessionFilePath } from '@/lib/adapters/storage/factory';

export interface ProcessFileOptions {
  file: File;
  sessionId?: string; // Required for replace, optional for new upload
  userId: string;
  workspaceId: string;
  sessionName?: string;
  db: IDBAdapter;
  storage: IStorageAdapter;
}

export interface ProcessFileResult {
  sessionId: string;
  metadata: any;
  fileHash: string;
  parquetSize?: number;
  compressionRatio: number;
  processingTime: number;
  columnsMatch?: boolean; // Only for replace operations
}

/**
 * Process a file (upload new or replace existing)
 * Returns session ID and metadata
 */
export async function processFile(
  options: ProcessFileOptions
): Promise<ProcessFileResult> {
  const { file, sessionId, userId, workspaceId, sessionName, db, storage } = options;

  let tempFilePath: string | null = null;
  let tempParquetPath: string | null = null;

  try {
    // Determine file type
    const fileName = file.name.toLowerCase();
    let fileType: 'xlsx' | 'xls' | 'csv';

    if (fileName.endsWith('.csv')) {
      fileType = 'csv';
    } else if (fileName.endsWith('.xlsx')) {
      fileType = 'xlsx';
    } else if (fileName.endsWith('.xls')) {
      fileType = 'xls';
    } else {
      throw new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported');
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[FileProcessing] Processing ${fileType} file: ${file.name} (${file.size} bytes)`);

    // Save to temporary file (required by DuckDB)
    const tempDir = path.join(os.tmpdir(), 'magixcel-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sanitizedFileName = sanitizeFilename(file.name);
    tempFilePath = path.join(tempDir, `${Date.now()}-${nanoid(8)}-${sanitizedFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[FileProcessing] Temp file saved: ${tempFilePath}`);

    // Generate temporary Parquet path
    tempParquetPath = path.join(tempDir, `${Date.now()}-${nanoid(8)}.parquet`);

    // Convert to Parquet using DuckDB
    const converter = createParquetConverter();
    const conversionResult = await converter.convert({
      inputPath: tempFilePath,
      outputPath: tempParquetPath,
      fileType,
    });

    await converter.close();

    console.log(`[FileProcessing] Conversion completed:`, {
      parquetSize: conversionResult.metadata.parquetSize,
      compressionRatio: `${(conversionResult.compressionRatio * 100).toFixed(2)}%`,
      processingTime: `${conversionResult.processingTime}ms`,
    });

    const newMetadata = conversionResult.metadata;

    // Handle REPLACE vs NEW UPLOAD
    let finalSessionId: string;
    let columnsMatch: boolean | undefined = undefined;

    if (sessionId) {
      // REPLACE MODE: Update existing session
      console.log(`[FileProcessing] Replace mode: updating session ${sessionId}`);

      // Get existing session
      const existingSession = await db.getSession(sessionId, userId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      // Compare columns
      const oldColumns = existingSession.metadata.sheets[0]?.columns || [];
      const newColumns = newMetadata.sheets[0]?.columns || [];

      const missingColumns = oldColumns.filter(
        (oldCol: any) =>
          !newColumns.some(
            (newCol: any) => newCol.name === oldCol.name && newCol.type === oldCol.type
          )
      );

      columnsMatch = missingColumns.length === 0;

      console.log(`[FileProcessing] Columns match: ${columnsMatch}`);
      if (!columnsMatch) {
        console.log(`[FileProcessing] Missing columns:`, missingColumns);

        // Delete all views/charts/active_views
        const views = await db.listViews(userId, workspaceId, sessionId);

        for (const view of views) {
          // Delete charts
          const charts = await db.listViewCharts(view.id);
          for (const chart of charts) {
            await db.deleteViewChart(chart.id);
          }

          // Delete view
          await db.deleteView(view.id, userId);
        }

        // Delete all active views for this session
        const activeViews = await db.listActiveViews(sessionId);
        for (const av of activeViews) {
          await db.deactivateView(sessionId, av.sheet_name, av.view_id);
        }

        console.log(`[FileProcessing] Deleted ${views.length} views and their charts`);
      }

      finalSessionId = sessionId;
    } else {
      // NEW UPLOAD MODE: Create new session
      console.log(`[FileProcessing] New upload mode: creating session`);

      const sessionData = {
        workspace_id: workspaceId,
        name: sessionName || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        original_file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_hash: conversionResult.fileHash,
        r2_path_original: '', // Will be set after upload
        r2_path_parquet: '', // Will be set after upload
        metadata: newMetadata,
      };

      const newSession = await db.createSession(userId, sessionData);
      finalSessionId = newSession.id;

      console.log(`[FileProcessing] Session created: ${finalSessionId}`);
    }

    // Upload files to storage
    const originalPath = getSessionFilePath(finalSessionId, `original.${fileType}`);
    const parquetPath = getSessionFilePath(finalSessionId, 'data.parquet');

    console.log(`[FileProcessing] Uploading to storage...`);

    // Upload original file
    await storage.upload(originalPath, buffer, file.type);

    // Upload Parquet file
    const parquetBuffer = fs.readFileSync(tempParquetPath);
    await storage.upload(parquetPath, parquetBuffer, 'application/octet-stream');

    console.log(`[FileProcessing] Files uploaded successfully`);

    // Update session with final data
    await db.updateSession(finalSessionId, userId, {
      name: sessionName || file.name.replace(/\.[^/.]+$/, ''),
      original_file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      file_hash: conversionResult.fileHash,
      r2_path_original: originalPath,
      r2_path_parquet: parquetPath,
      metadata: newMetadata,
      ...(sessionId && { active_filters: null }), // Reset filters only on replace
    });

    console.log(`[FileProcessing] Session updated with storage paths`);

    // Cleanup temp files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`[FileProcessing] Cleaned up temp file`);
    }
    if (tempParquetPath && fs.existsSync(tempParquetPath)) {
      fs.unlinkSync(tempParquetPath);
      console.log(`[FileProcessing] Cleaned up temp parquet`);
    }

    return {
      sessionId: finalSessionId,
      metadata: newMetadata,
      fileHash: conversionResult.fileHash,
      parquetSize: newMetadata.parquetSize,
      compressionRatio: conversionResult.compressionRatio,
      processingTime: conversionResult.processingTime,
      columnsMatch,
    };
  } catch (error) {
    // Cleanup temp files on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[FileProcessing] Cleaned up temp file after error`);
      } catch (cleanupError) {
        console.error(`[FileProcessing] Failed to cleanup temp file:`, cleanupError);
      }
    }
    if (tempParquetPath && fs.existsSync(tempParquetPath)) {
      try {
        fs.unlinkSync(tempParquetPath);
        console.log(`[FileProcessing] Cleaned up temp parquet after error`);
      } catch (cleanupError) {
        console.error(`[FileProcessing] Failed to cleanup temp parquet:`, cleanupError);
      }
    }

    throw error;
  }
}

/**
 * Analyze a file without uploading it
 * Used for preview/comparison before replacing
 */
export async function analyzeFile(file: File): Promise<{
  metadata: any;
  fileHash: string;
  compressionRatio: number;
  processingTime: number;
}> {
  let tempFilePath: string | null = null;
  let tempParquetPath: string | null = null;

  try {
    // Determine file type
    const fileName = file.name.toLowerCase();
    let fileType: 'xlsx' | 'xls' | 'csv';

    if (fileName.endsWith('.csv')) {
      fileType = 'csv';
    } else if (fileName.endsWith('.xlsx')) {
      fileType = 'xlsx';
    } else if (fileName.endsWith('.xls')) {
      fileType = 'xls';
    } else {
      throw new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported');
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[AnalyzeFile] Processing ${fileType} file: ${file.name} (${file.size} bytes)`);

    // Save to temporary file
    const tempDir = path.join(os.tmpdir(), 'magixcel-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sanitizedFileName = sanitizeFilename(file.name);
    tempFilePath = path.join(tempDir, `analyze-${Date.now()}-${nanoid(8)}-${sanitizedFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[AnalyzeFile] Temp file saved: ${tempFilePath}`);

    // Generate temporary Parquet path
    tempParquetPath = path.join(tempDir, `analyze-${Date.now()}-${nanoid(8)}.parquet`);

    // Convert to Parquet to extract metadata
    const converter = createParquetConverter();
    const result = await converter.convert({
      inputPath: tempFilePath,
      outputPath: tempParquetPath,
      fileType,
    });

    await converter.close();

    console.log(`[AnalyzeFile] Metadata extracted:`, result.metadata);

    return {
      metadata: result.metadata,
      fileHash: result.fileHash,
      compressionRatio: result.compressionRatio,
      processingTime: result.processingTime,
    };
  } finally {
    // Cleanup temp files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[AnalyzeFile] Cleaned up temp file`);
      } catch (cleanupError) {
        console.error(`[AnalyzeFile] Failed to cleanup temp file:`, cleanupError);
      }
    }
    if (tempParquetPath && fs.existsSync(tempParquetPath)) {
      try {
        fs.unlinkSync(tempParquetPath);
        console.log(`[AnalyzeFile] Cleaned up temp parquet`);
      } catch (cleanupError) {
        console.error(`[AnalyzeFile] Failed to cleanup temp parquet:`, cleanupError);
      }
    }
  }
}

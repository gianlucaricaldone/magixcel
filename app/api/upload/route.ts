/**
 * File Upload API Route (Refactored)
 *
 * Handles file uploads with new architecture:
 * - Converts Excel/CSV to Parquet using DuckDB
 * - Stores original + Parquet using Storage Adapter
 * - Saves metadata using DB Adapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter, getSessionFilePath } from '@/lib/adapters/storage/factory';
import { createParquetConverter } from '@/lib/processing/parquet-converter';
import { ERROR_CODES, MAX_FILE_SIZE } from '@/lib/utils/constants';
import { sanitizeFilename } from '@/lib/utils/validators';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  let tempParquetPath: string | null = null;

  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const userId = getCurrentUserId();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionName = formData.get('sessionName') as string;
    const workspaceId = (formData.get('workspaceId') as string) || 'default';

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'No file provided',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.FILE_TOO_LARGE,
            message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          },
        },
        { status: 413 }
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_FILE_TYPE,
            message: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported',
          },
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Upload] Processing ${fileType} file: ${file.name} (${file.size} bytes)`);

    // Save to temporary file (required by DuckDB)
    const tempDir = path.join(os.tmpdir(), 'magixcel-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const sanitizedFileName = sanitizeFilename(file.name);
    tempFilePath = path.join(tempDir, `${Date.now()}-${sanitizedFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[Upload] Temp file saved: ${tempFilePath}`);

    // Generate temporary Parquet path
    tempParquetPath = path.join(tempDir, `${Date.now()}-data.parquet`);

    // Convert to Parquet using DuckDB
    const converter = createParquetConverter();
    const conversionResult = await converter.convert({
      inputPath: tempFilePath,
      outputPath: tempParquetPath,
      fileType,
    });

    await converter.close();

    console.log(`[Upload] Conversion completed:`, {
      parquetSize: conversionResult.metadata.parquetSize,
      compressionRatio: `${(conversionResult.compressionRatio * 100).toFixed(2)}%`,
      processingTime: `${conversionResult.processingTime}ms`,
    });

    // Create session in database (get ID first)
    const sessionData = {
      workspace_id: workspaceId,
      name: sessionName || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      original_file_name: file.name,
      file_type: fileType,
      file_size: file.size,
      file_hash: conversionResult.fileHash,
      r2_path_original: '', // Will be set after upload
      r2_path_parquet: '', // Will be set after upload
      metadata: conversionResult.metadata,
    };

    const session = await db.createSession(userId, sessionData);

    console.log(`[Upload] Session created: ${session.id}`);

    // Upload files to storage
    const originalPath = getSessionFilePath(session.id, `original.${fileType}`);
    const parquetPath = getSessionFilePath(session.id, 'data.parquet');

    console.log(`[Upload] Uploading to storage...`);

    // Upload original file
    await storage.upload(originalPath, buffer, file.type);

    // Upload Parquet file
    const parquetBuffer = fs.readFileSync(tempParquetPath);
    await storage.upload(parquetPath, parquetBuffer, 'application/octet-stream');

    console.log(`[Upload] Files uploaded successfully`);

    // Update session with storage paths
    await db.updateSession(session.id, userId, {
      r2_path_original: originalPath,
      r2_path_parquet: parquetPath,
    });

    // Cleanup temp files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (tempParquetPath && fs.existsSync(tempParquetPath)) {
      fs.unlinkSync(tempParquetPath);
    }

    console.log(`[Upload] Upload complete: ${session.id}`);

    // Prepare response metadata
    const responseMetadata = {
      sessionId: session.id,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      sheets: conversionResult.metadata.sheets,
      totalRows: conversionResult.metadata.totalRows,
      totalColumns: conversionResult.metadata.totalColumns,
      parquetSize: conversionResult.metadata.parquetSize,
      compressionRatio: conversionResult.compressionRatio,
      processingTime: conversionResult.processingTime,
    };

    return NextResponse.json({
      success: true,
      data: responseMetadata,
    });

  } catch (error: any) {
    console.error('[Upload] Error:', error);

    // Cleanup temp files on error
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (tempParquetPath && fs.existsSync(tempParquetPath)) {
        fs.unlinkSync(tempParquetPath);
      }
    } catch (cleanupError) {
      console.error('[Upload] Cleanup error:', cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to process file',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

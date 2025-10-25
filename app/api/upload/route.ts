/**
 * File Upload API Route (Refactored)
 *
 * Handles file uploads using shared file processing service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { processFile } from '@/lib/services/file-processing-service';
import { ERROR_CODES, MAX_FILE_SIZE } from '@/lib/utils/constants';

export async function POST(request: NextRequest) {
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

    // Process file using shared service
    const result = await processFile({
      file,
      userId,
      workspaceId,
      sessionName,
      db,
      storage,
    });

    console.log(`[Upload] Upload complete: ${result.sessionId}`);

    // Prepare response metadata
    const responseMetadata = {
      sessionId: result.sessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
      sheets: result.metadata.sheets,
      totalRows: result.metadata.totalRows,
      totalColumns: result.metadata.totalColumns,
      parquetSize: result.parquetSize,
      compressionRatio: result.compressionRatio,
      processingTime: result.processingTime,
    };

    return NextResponse.json({
      success: true,
      data: responseMetadata,
    });

  } catch (error: any) {
    console.error('[Upload] Error:', error);

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

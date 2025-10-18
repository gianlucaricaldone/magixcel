import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { processExcelFile } from '@/lib/processing/excel-processor';
import { processCSVFile } from '@/lib/processing/csv-processor';
import { ERROR_CODES, MAX_FILE_SIZE } from '@/lib/utils/constants';
import { sanitizeFilename } from '@/lib/utils/validators';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionName = formData.get('sessionName') as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.PROCESSING_ERROR,
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

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate file hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Determine file type and process
    const fileName = file.name.toLowerCase();
    let metadata;
    let data;

    if (fileName.endsWith('.csv')) {
      const result = await processCSVFile(buffer, file.name, {
        skipEmptyLines: true,
        trimValues: true,
        parseNumbers: true,
        parseDates: true,
        inferTypes: true,
      });
      metadata = result.metadata;
      data = result.data;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const result = await processExcelFile(buffer, file.name, {
        skipEmptyLines: true,
        trimValues: true,
        parseNumbers: true,
        parseDates: true,
        inferTypes: true,
      });
      metadata = result.metadata;
      data = result.data;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_FILE_TYPE,
            message: 'Invalid file type. Only Excel and CSV files are supported',
          },
        },
        { status: 400 }
      );
    }

    // Create session
    const session = await db.createSession({
      name: sessionName || metadata.fileName,
      original_file_name: metadata.fileName,
      original_file_hash: hash,
      row_count: metadata.rowCount,
      column_count: metadata.columnCount,
      file_size: metadata.fileSize,
      file_type: metadata.fileType,
    });

    // Store file
    const sanitizedFileName = sanitizeFilename(file.name);
    const storagePath = await storage.save(session.id, sanitizedFileName, buffer);

    // Create file record
    await db.createFile({
      session_id: session.id,
      file_type: file.type,
      storage_type: 'local',
      storage_path: storagePath,
    });

    // Store data as JSON in a separate file
    const dataBuffer = Buffer.from(JSON.stringify(data));
    await storage.save(session.id, 'data.json', dataBuffer);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      metadata,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to process file',
        },
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

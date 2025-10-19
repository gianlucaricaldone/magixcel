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
    // Check if this is a JSON request (from existing session) or form data (file upload)
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Handle creation from existing file
      const body = await request.json();
      const { fromFileHash, workspaceId = 'default', sessionName } = body;

      if (!fromFileHash) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'fromFileHash is required',
            },
          },
          { status: 400 }
        );
      }

      // Find any session that uses this file (we'll use it as reference)
      const allSessions = await db.listSessions(1000, 0);
      const referenceSession = allSessions.find(s => s.original_file_hash === fromFileHash);

      if (!referenceSession) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.SESSION_NOT_FOUND,
              message: 'No session found with this file',
            },
          },
          { status: 404 }
        );
      }

      // Determine session name (use file name as default, not reference session name)
      const newSessionName = sessionName && sessionName.trim()
        ? sessionName.trim()
        : referenceSession.original_file_name.replace(/\.[^/.]+$/, ''); // Remove extension

      // Create new session sharing the same file
      const newSession = await db.createSession({
        workspace_id: workspaceId,
        name: newSessionName,
        original_file_name: referenceSession.original_file_name,
        original_file_hash: referenceSession.original_file_hash,
        row_count: referenceSession.row_count,
        column_count: referenceSession.column_count,
        file_size: referenceSession.file_size,
        file_type: referenceSession.file_type,
      });

      // Get the file record from reference session
      const existingFile = await db.getFileBySession(referenceSession.id);
      if (existingFile) {
        // Create file record pointing to the same storage path
        await db.createFile({
          session_id: newSession.id,
          file_type: existingFile.file_type,
          storage_type: existingFile.storage_type,
          storage_path: existingFile.storage_path,
        });
      }

      // Copy data.json and sheets.json to new session directory
      try {
        // Get data.json from reference session
        const dataJsonPath = `${referenceSession.id}/data.json`;
        const dataJson = await storage.get(dataJsonPath);
        await storage.save(newSession.id, 'data.json', dataJson);

        // Try to copy sheets.json if it exists
        try {
          const sheetsJsonPath = `${referenceSession.id}/sheets.json`;
          const sheetsJson = await storage.get(sheetsJsonPath);
          await storage.save(newSession.id, 'sheets.json', sheetsJson);
        } catch (error) {
          // sheets.json might not exist for CSV files, that's ok
        }
      } catch (error) {
        console.error('Error copying data files:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.PROCESSING_ERROR,
              message: 'Failed to copy session data',
            },
          },
          { status: 500 }
        );
      }

      // Load metadata from data.json
      const dataJsonPath = `${newSession.id}/data.json`;
      const dataJsonBuffer = await storage.get(dataJsonPath);
      const data = JSON.parse(dataJsonBuffer.toString());
      const metadata = {
        fileName: referenceSession.original_file_name,
        fileSize: referenceSession.file_size,
        fileType: referenceSession.file_type,
        rowCount: referenceSession.row_count,
        columnCount: referenceSession.column_count,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        preview: data.slice(0, 10),
      };

      return NextResponse.json({
        success: true,
        sessionId: newSession.id,
        metadata,
      });
    }

    // Original file upload logic
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionName = formData.get('sessionName') as string;
    const workspaceId = (formData.get('workspaceId') as string) || 'default'; // Use default workspace if not specified

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
    let sheets = null;

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
      sheets = result.sheets;
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
      workspace_id: workspaceId,
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

    // Store sheets data if available (Excel files with multiple sheets)
    if (sheets && sheets.length > 0) {
      const sheetsBuffer = Buffer.from(JSON.stringify(sheets));
      await storage.save(session.id, 'sheets.json', sheetsBuffer);
    }

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

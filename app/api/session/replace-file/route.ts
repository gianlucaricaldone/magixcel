/**
 * Replace session file endpoint
 *
 * PUT /api/session/replace-file
 * Replaces the session's file with a new one using shared file processing service
 * - If columns match: Keeps views/charts
 * - If columns don't match: Deletes views/charts/active_views
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { processFile } from '@/lib/services/file-processing-service';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function PUT(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const userId = getCurrentUserId();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'File is required' },
        },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Session ID is required' },
        },
        { status: 400 }
      );
    }

    // Check session exists
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ERROR_CODES.SESSION_NOT_FOUND, message: 'Session not found' },
        },
        { status: 404 }
      );
    }

    console.log('[Replace] Starting file replacement for session:', sessionId);

    // Process file using shared service (handles conversion, upload, db update, cleanup)
    const result = await processFile({
      file,
      sessionId, // Pass sessionId to trigger replace mode
      userId,
      workspaceId: session.workspace_id,
      db,
      storage,
    });

    console.log('[Replace] File replacement completed successfully');

    return NextResponse.json({
      success: true,
      message: 'File replaced successfully',
      columnsMatch: result.columnsMatch,
      session: {
        id: sessionId,
        name: file.name.replace(/\.[^/.]+$/, ''),
      },
    });
  } catch (error: any) {
    console.error('[Replace] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to replace file',
        },
      },
      { status: 500 }
    );
  }
}

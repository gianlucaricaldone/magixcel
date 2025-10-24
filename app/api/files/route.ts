import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/files
 * List all unique files in the system (grouped by file_hash)
 * Optional: filter by workspace
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    // Get all sessions (optionally filtered by workspace)
    const sessions = await db.listSessions(userId, workspaceId || undefined, 1000, 0);

    // Group sessions by file_hash to get unique files
    const fileMap = new Map();

    for (const session of sessions) {
      const hash = session.file_hash;

      if (!fileMap.has(hash)) {
        // This is the first session with this file
        fileMap.set(hash, {
          file_hash: hash,
          file_name: session.original_file_name,
          file_type: session.file_type,
          file_size: session.file_size,
          row_count: session.metadata?.totalRows || 0,
          column_count: session.metadata?.totalColumns || 0,
          first_imported: session.created_at,
          usage_count: 1,
          example_session_id: session.id, // For reference when creating new session
        });
      } else {
        // This file is used by another session, increment counter
        const existingFile = fileMap.get(hash);
        existingFile.usage_count++;

        // Keep the earliest import date
        if (session.created_at < existingFile.first_imported) {
          existingFile.first_imported = session.created_at;
        }
      }
    }

    // Convert map to array
    const files = Array.from(fileMap.values());

    // Sort by first imported date (most recent first)
    files.sort((a, b) =>
      new Date(b.first_imported).getTime() - new Date(a.first_imported).getTime()
    );

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error: any) {
    console.error('Failed to list files:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: 'Failed to retrieve files',
        },
      },
      { status: 500 }
    );
  }
}

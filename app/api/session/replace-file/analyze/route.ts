/**
 * Analyze replacement file endpoint
 *
 * POST /api/session/replace-file/analyze
 * Extracts metadata from file and returns column comparison data using shared service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { analyzeFile } from '@/lib/services/file-processing-service';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const db = getDBAdapter();
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

    // Analyze file using shared service (handles conversion, metadata extraction, cleanup)
    const result = await analyzeFile(file);

    // Get view and chart counts for this session
    const views = await db.listViews(userId, session.workspace_id, sessionId);
    let totalCharts = 0;
    for (const view of views) {
      const charts = await db.listViewCharts(view.id);
      totalCharts += charts.length;
    }

    // Return metadata for comparison
    return NextResponse.json({
      success: true,
      metadata: result.metadata,
      viewCount: views.length,
      chartCount: totalCharts,
    });
  } catch (error: any) {
    console.error('[Analyze] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to analyze file',
        },
      },
      { status: 500 }
    );
  }
}

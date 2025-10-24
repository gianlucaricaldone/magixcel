/**
 * Session Sheets API Route (Refactored)
 *
 * Returns sheet metadata for Excel files from session.metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    // Get session metadata
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Only Excel files have multiple sheets
    if (session.file_type !== 'xlsx' && session.file_type !== 'xls') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'This session is not an Excel file',
          },
        },
        { status: 400 }
      );
    }

    // Get sheets metadata from session.metadata
    const sheets = session.metadata?.sheets || [];

    // Return sheet metadata (already in correct format)
    return NextResponse.json({
      success: true,
      sheets,
    });

  } catch (error) {
    console.error('Error in GET /api/session/[id]/sheets:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get sheets',
        },
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    // Validate session exists
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Get filter state from request body
    const { filtersBySheet } = await request.json();

    // Save filters as JSON string
    const filtersJson = JSON.stringify(filtersBySheet);

    await db.updateSession(sessionId, userId, {
      active_filters: filtersJson,
    });

    return NextResponse.json({
      success: true,
      message: 'Filters saved successfully',
    });
  } catch (error: any) {
    console.error('Save filters error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to save filters',
        },
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Validate session exists
    const session = await db.getSession(sessionId);
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

    await db.updateSession(sessionId, {
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

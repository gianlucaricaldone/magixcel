import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/active-views?sessionId=xxx&sheetName=xxx
 * List active views for a session/sheet
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const sheetName = searchParams.get('sheetName');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'sessionId is required' } },
        { status: 400 }
      );
    }

    const activeViews = await db.listActiveViews(
      sessionId,
      sheetName !== null ? sheetName : undefined
    );

    return NextResponse.json({
      success: true,
      activeViews,
    });
  } catch (error: unknown) {
    console.error('Error fetching active views:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to fetch active views',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/active-views
 * Activate a view on a specific sheet
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const body = await request.json();
    const { sessionId, sheetName, viewId } = body;

    // Validation
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'sessionId is required' } },
        { status: 400 }
      );
    }

    if (!viewId || typeof viewId !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'viewId is required' } },
        { status: 400 }
      );
    }

    // sheetName can be null for CSV files
    const activeView = await db.activateView(sessionId, sheetName || null, viewId);

    return NextResponse.json({
      success: true,
      activeView,
    });
  } catch (error: unknown) {
    console.error('Error activating view:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to activate view',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/active-views
 * Deactivate a view from a specific sheet
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const sheetName = searchParams.get('sheetName');
    const viewId = searchParams.get('viewId');

    if (!sessionId || !viewId) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'sessionId and viewId are required' } },
        { status: 400 }
      );
    }

    await db.deactivateView(sessionId, sheetName || null, viewId);

    return NextResponse.json({
      success: true,
      message: 'View deactivated successfully',
    });
  } catch (error: unknown) {
    console.error('Error deactivating view:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to deactivate view',
        },
      },
      { status: 500 }
    );
  }
}

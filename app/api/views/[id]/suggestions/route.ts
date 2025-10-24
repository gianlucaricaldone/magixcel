import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { suggestCharts } from '@/lib/charts/suggestions';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/views/[id]/suggestions
 * Get smart chart suggestions based on view data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    // Check if view exists
    const view = await db.getView(params.id, userId);
    if (!view) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'View not found' } },
        { status: 404 }
      );
    }

    // For snapshot views, we have the data
    if (view.view_type === 'snapshot' && view.snapshot_data) {
      const data = Array.isArray(view.snapshot_data) ? view.snapshot_data : JSON.parse(JSON.stringify(view.snapshot_data));

      if (data.length === 0) {
        return NextResponse.json({
          success: true,
          suggestions: [],
          message: 'No data available for suggestions',
        });
      }

      const columns = Object.keys(data[0]);
      const suggestions = suggestCharts(data, columns);

      return NextResponse.json({
        success: true,
        suggestions,
      });
    }

    // For filters_only views, we need the session data
    if (view.session_id) {
      // Get session to access data
      const session = await db.getSession(view.session_id, userId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Session not found' } },
          { status: 404 }
        );
      }

      // Load session data (simplified - in real app you'd apply filters)
      // For now, return message that suggestions need data
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'Load the session data to get chart suggestions',
        sessionId: session.id,
      });
    }

    return NextResponse.json({
      success: true,
      suggestions: [],
      message: 'This view has no associated data for suggestions',
    });
  } catch (error: unknown) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to generate suggestions',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/views/[id]/suggestions
 * Get chart suggestions based on provided data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid or empty data array' } },
        { status: 400 }
      );
    }

    const columns = Object.keys(data[0]);
    const suggestions = suggestCharts(data, columns);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: unknown) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to generate suggestions',
        },
      },
      { status: 500 }
    );
  }
}

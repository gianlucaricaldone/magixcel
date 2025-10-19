import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestCharts } from '@/lib/charts/suggestions';

/**
 * GET /api/views/[id]/suggestions
 * Get smart chart suggestions based on view data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if view exists
    const view = await db.getView(params.id);
    if (!view) {
      return NextResponse.json(
        { success: false, error: 'View not found' },
        { status: 404 }
      );
    }

    // For snapshot views, we have the data
    if (view.view_type === 'snapshot' && view.snapshot_data) {
      const data = JSON.parse(view.snapshot_data);

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
      const session = await db.getSession(view.session_id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
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
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
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
        { success: false, error: 'Invalid or empty data array' },
        { status: 400 }
      );
    }

    const columns = Object.keys(data[0]);
    const suggestions = suggestCharts(data, columns);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
      },
      { status: 500 }
    );
  }
}

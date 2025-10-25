import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * PUT /api/views/[id]/charts/reorder
 * Reorder charts in a view (for drag-drop functionality)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const body = await request.json();
    const { chartIds } = body;

    // Validate
    if (!Array.isArray(chartIds)) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'chartIds must be an array' } },
        { status: 400 }
      );
    }

    // Check if view exists
    const view = await db.getView(params.id, userId);
    if (!view) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'View not found' } },
        { status: 404 }
      );
    }

    // Verify all charts belong to this view
    const existingCharts = await db.listViewCharts(params.id);
    const existingIds = new Set(existingCharts.map(c => c.id));

    for (const chartId of chartIds) {
      if (!existingIds.has(chartId)) {
        return NextResponse.json(
          { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: `Chart ${chartId} does not belong to this view` } },
          { status: 400 }
        );
      }
    }

    // Reorder
    await db.reorderViewCharts(params.id, chartIds);

    // Return updated charts
    const charts = await db.listViewCharts(params.id);

    return NextResponse.json({
      success: true,
      charts,
    });
  } catch (error: unknown) {
    console.error('Error reordering charts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to reorder charts',
        },
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PUT /api/views/[id]/charts/reorder
 * Reorder charts in a view (for drag-drop functionality)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { chartIds } = body;

    // Validate
    if (!Array.isArray(chartIds)) {
      return NextResponse.json(
        { success: false, error: 'chartIds must be an array' },
        { status: 400 }
      );
    }

    // Check if view exists
    const view = await db.getView(params.id);
    if (!view) {
      return NextResponse.json(
        { success: false, error: 'View not found' },
        { status: 404 }
      );
    }

    // Verify all charts belong to this view
    const existingCharts = await db.listViewCharts(params.id);
    const existingIds = new Set(existingCharts.map(c => c.id));

    for (const chartId of chartIds) {
      if (!existingIds.has(chartId)) {
        return NextResponse.json(
          { success: false, error: `Chart ${chartId} does not belong to this view` },
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
  } catch (error) {
    console.error('Error reordering charts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder charts',
      },
      { status: 500 }
    );
  }
}

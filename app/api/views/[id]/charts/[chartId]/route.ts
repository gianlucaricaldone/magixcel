import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/views/[id]/charts/[chartId]
 * Get a specific chart
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chartId: string } }
) {
  try {
    const chart = await db.getViewChart(params.chartId);

    if (!chart) {
      return NextResponse.json(
        { success: false, error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Verify chart belongs to this view
    if (chart.view_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Chart does not belong to this view' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error('Error fetching chart:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chart',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/views/[id]/charts/[chartId]
 * Update a chart
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; chartId: string } }
) {
  try {
    const body = await request.json();
    const { title, config, size, position } = body;

    // Check if chart exists
    const existing = await db.getViewChart(params.chartId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Verify chart belongs to this view
    if (existing.view_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Chart does not belong to this view' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (size !== undefined) updates.size = size;
    if (position !== undefined) updates.position = position;

    if (config !== undefined) {
      // Validate config is valid JSON
      try {
        const configString = typeof config === 'string' ? config : JSON.stringify(config);
        JSON.parse(configString); // Validate
        updates.config = configString;
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid chart configuration JSON' },
          { status: 400 }
        );
      }
    }

    // Update chart
    const chart = await db.updateViewChart(params.chartId, updates);

    return NextResponse.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error('Error updating chart:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update chart',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/views/[id]/charts/[chartId]
 * Delete a chart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; chartId: string } }
) {
  try {
    // Check if chart exists
    const existing = await db.getViewChart(params.chartId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Verify chart belongs to this view
    if (existing.view_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Chart does not belong to this view' },
        { status: 403 }
      );
    }

    await db.deleteViewChart(params.chartId);

    return NextResponse.json({
      success: true,
      message: 'Chart deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chart:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chart',
      },
      { status: 500 }
    );
  }
}

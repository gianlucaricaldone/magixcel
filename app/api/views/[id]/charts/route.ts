import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/views/[id]/charts
 * List all charts for a view
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

    // Get charts
    const charts = await db.listViewCharts(params.id);

    return NextResponse.json({
      success: true,
      charts,
    });
  } catch (error) {
    console.error('Error fetching charts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch charts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/views/[id]/charts
 * Create a new chart for a view
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, chart_type, config, size, position } = body;

    // Validate required fields
    if (!title || !chart_type || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, chart_type, config' },
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

    // Validate config is valid JSON
    let configString: string;
    try {
      configString = typeof config === 'string' ? config : JSON.stringify(config);
      JSON.parse(configString); // Validate it's valid JSON
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid chart configuration JSON' },
        { status: 400 }
      );
    }

    // Get current chart count for position
    const currentPosition = position !== undefined ? position : view.chart_count;

    // Create chart
    const chart = await db.createViewChart({
      view_id: params.id,
      chart_type,
      title,
      config: configString,
      size: size || 'medium',
      position: currentPosition,
    });

    return NextResponse.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error('Error creating chart:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chart',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ERROR_CODES } from '@/lib/utils/constants';

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
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'View not found',
          },
        },
        { status: 404 }
      );
    }

    // Get charts
    const charts = await db.listViewCharts(params.id);

    return NextResponse.json({
      success: true,
      charts,
    });
  } catch (error: unknown) {
    console.error('Error fetching charts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to fetch charts',
        },
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
    const { title, chartType, config, size, position } = body;

    // Validate required fields
    if (!title || !chartType || !config) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Missing required fields: title, chartType, config',
          },
        },
        { status: 400 }
      );
    }

    // Check if view exists
    const view = await db.getView(params.id);
    if (!view) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'View not found',
          },
        },
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
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid chart configuration JSON',
          },
        },
        { status: 400 }
      );
    }

    // Get current chart count for position
    const currentPosition = position !== undefined ? position : view.chart_count;

    // Create chart - convert camelCase to snake_case for DB
    const chart = await db.createViewChart({
      view_id: params.id,
      chart_type: chartType, // Convert camelCase → snake_case
      title,
      config: configString,
      size: size || 'medium',
      position: currentPosition,
    });

    return NextResponse.json({
      success: true,
      chart,
    });
  } catch (error: unknown) {
    console.error('Error creating chart:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to create chart',
        },
      },
      { status: 500 }
    );
  }
}

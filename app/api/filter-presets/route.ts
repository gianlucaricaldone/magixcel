import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { IFilterConfig } from '@/types';

/**
 * GET /api/filter-presets
 * List all filter presets (optionally filtered by category)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const presets = await db.listFilterPresets(category);

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (error) {
    console.error('Error fetching filter presets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter presets',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/filter-presets
 * Create a new filter preset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, filterConfig } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!filterConfig || !filterConfig.filters || !filterConfig.combinator) {
      return NextResponse.json(
        { success: false, error: 'Invalid filter configuration' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await db.getFilterPresetByName(name);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A preset with this name already exists' },
        { status: 409 }
      );
    }

    // Create preset
    const preset = await db.createFilterPreset({
      name,
      description: description || '',
      category: category || 'Custom',
      filter_config: JSON.stringify(filterConfig),
    });

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    console.error('Error creating filter preset:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create filter preset',
      },
      { status: 500 }
    );
  }
}

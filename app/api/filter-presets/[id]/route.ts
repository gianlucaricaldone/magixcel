import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/filter-presets/[id]
 * Get a specific filter preset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const preset = await db.getFilterPreset(params.id);

    if (!preset) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    console.error('Error fetching filter preset:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter preset',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/filter-presets/[id]
 * Update an existing filter preset
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, category, filterConfig } = body;

    // Check if preset exists
    const existing = await db.getFilterPreset(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another preset
    if (name && name !== existing.name) {
      const nameConflict = await db.getFilterPresetByName(name);
      if (nameConflict && nameConflict.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'A preset with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (filterConfig !== undefined) {
      updates.filter_config = JSON.stringify(filterConfig);
    }

    // Update preset
    const preset = await db.updateFilterPreset(params.id, updates);

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    console.error('Error updating filter preset:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update filter preset',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/filter-presets/[id]
 * Delete a filter preset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if preset exists
    const existing = await db.getFilterPreset(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    await db.deleteFilterPreset(params.id);

    return NextResponse.json({
      success: true,
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting filter preset:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete filter preset',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';
import { IView } from '@/types/database';

/**
 * GET /api/views/[id]
 * Get a specific view by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const view = await db.getView(params.id, userId);

    if (!view) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'View not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      view,
    });
  } catch (error: unknown) {
    console.error('Error fetching view:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to fetch view',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/views/[id]
 * Update an existing view
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const body = await request.json();
    const { name, description, category, filterConfig, isPublic } = body;

    // Check if view exists
    const existing = await db.getView(params.id, userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'View not found' } },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another view in the same workspace
    if (name && name !== existing.name) {
      const workspaceViews = await db.listViews(userId, existing.workspace_id, undefined, undefined);
      const nameConflict = workspaceViews.find((v) => v.name === name && v.id !== params.id);
      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'A view with this name already exists' } },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updates: Partial<IView> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (filterConfig !== undefined) {
      updates.filter_config = filterConfig;
    }
    if (isPublic !== undefined) {
      updates.is_public = isPublic;
    }

    // Update view
    const view = await db.updateView(params.id, userId, updates);

    return NextResponse.json({
      success: true,
      view,
    });
  } catch (error: unknown) {
    console.error('Error updating view:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to update view',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/views/[id]
 * Delete a view
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    // Check if view exists
    const existing = await db.getView(params.id, userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'View not found' } },
        { status: 404 }
      );
    }

    await db.deleteView(params.id, userId);

    return NextResponse.json({
      success: true,
      message: 'View deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting view:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to delete view',
        },
      },
      { status: 500 }
    );
  }
}

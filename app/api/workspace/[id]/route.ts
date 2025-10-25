/**
 * Workspace Detail API Routes (Refactored)
 *
 * GET    /api/workspace/[id] - Get workspace by ID
 * PUT    /api/workspace/[id] - Update workspace
 * DELETE /api/workspace/[id] - Delete workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';
import { IWorkspace } from '@/types/database';

/**
 * GET /api/workspace/[id]
 * Get a single workspace by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const workspaceId = params.id;

    const workspace = await db.getWorkspace(workspaceId, userId);

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Workspace not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error: unknown) {
    console.error('[Workspace GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get workspace',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspace/[id]
 * Update a workspace
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const workspaceId = params.id;

    const body = await request.json();
    const { name, description, color, icon } = body;

    // Validate workspace exists
    const existingWorkspace = await db.getWorkspace(workspaceId, userId);
    if (!existingWorkspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Workspace not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Workspace name cannot be empty',
          },
        },
        { status: 400 }
      );
    }

    // Build updates
    const updates: Partial<Omit<IWorkspace, 'id' | 'user_id' | 'created_at'>> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || undefined;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    const workspace = await db.updateWorkspace(workspaceId, userId, updates);

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error: unknown) {
    console.error('[Workspace PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to update workspace',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/[id]
 * Delete a workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const workspaceId = params.id;

    // Validate workspace exists
    const workspace = await db.getWorkspace(workspaceId, userId);
    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Workspace not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion of default workspace
    if (workspace.is_default) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Cannot delete default workspace',
          },
        },
        { status: 400 }
      );
    }

    // Delete workspace (cascade will delete associated sessions)
    await db.deleteWorkspace(workspaceId, userId);

    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error: unknown) {
    console.error('[Workspace DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Failed to delete workspace',
        },
      },
      { status: 500 }
    );
  }
}

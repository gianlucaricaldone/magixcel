import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    const workspaceId = params.id;

    const workspace = await db.getWorkspace(workspaceId);

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
      workspace,
    });
  } catch (error: unknown) {
    console.error('Get workspace error:', error);
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
    const workspaceId = params.id;
    const body = await request.json();
    const { name, description, color, icon } = body;

    // Validate workspace exists
    const existingWorkspace = await db.getWorkspace(workspaceId);
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

    // Update workspace
    const updates: Partial<IWorkspace> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    const workspace = await db.updateWorkspace(workspaceId, updates);

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error: unknown) {
    console.error('Update workspace error:', error);
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
    const workspaceId = params.id;

    // Prevent deletion of default workspace
    if (workspaceId === 'default') {
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

    // Validate workspace exists
    const workspace = await db.getWorkspace(workspaceId);
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

    // Delete workspace (cascade will delete associated sessions)
    await db.deleteWorkspace(workspaceId);

    return NextResponse.json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete workspace error:', error);
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

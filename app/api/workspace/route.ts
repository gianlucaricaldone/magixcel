/**
 * Workspace API Routes (Refactored)
 *
 * GET  /api/workspace - List all workspaces
 * POST /api/workspace - Create new workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/workspace
 * List all workspaces for current user
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const workspaces = await db.listWorkspaces(userId, limit, offset);

    return NextResponse.json({
      success: true,
      data: workspaces,
      count: workspaces.length,
    });
  } catch (error: any) {
    console.error('[Workspace GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message || 'Failed to list workspaces',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspace
 * Create a new workspace
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();

    const body = await request.json();
    const { name, description, color, icon } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Workspace name is required',
          },
        },
        { status: 400 }
      );
    }

    // Create workspace
    const workspace = await db.createWorkspace(userId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color || '#3B82F6',
      icon: icon || 'folder',
      is_default: false,
    });

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error: any) {
    console.error('[Workspace POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message || 'Failed to create workspace',
        },
      },
      { status: 500 }
    );
  }
}

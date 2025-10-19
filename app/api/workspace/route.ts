import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/workspace
 * List all workspaces
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const workspaces = await db.listWorkspaces(limit, offset);

    return NextResponse.json({
      success: true,
      workspaces,
      count: workspaces.length,
    });
  } catch (error: any) {
    console.error('List workspaces error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
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
    const workspace = await db.createWorkspace({
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color || '#3B82F6',
      icon: icon || 'folder',
    });

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to create workspace',
        },
      },
      { status: 500 }
    );
  }
}

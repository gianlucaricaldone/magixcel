import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * GET /api/workspace/[id]/sessions
 * List all sessions in a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get sessions for this workspace
    const sessions = await db.listSessionsByWorkspace(workspaceId, limit, offset);

    return NextResponse.json({
      success: true,
      workspace,
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('List workspace sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to list workspace sessions',
        },
      },
      { status: 500 }
    );
  }
}

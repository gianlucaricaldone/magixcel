import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';

/**
 * PUT /api/session/[id]/views-state
 * Update the open views state for a session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const { id: sessionId } = params;
    const body = await request.json();
    const { openViewIds, activeViewId } = body;

    // Validate input
    if (!Array.isArray(openViewIds)) {
      return NextResponse.json(
        { success: false, error: 'openViewIds must be an array' },
        { status: 400 }
      );
    }

    // Save state as JSON
    const state = JSON.stringify({
      openViewIds,
      activeViewId: activeViewId || null,
    });

    await db.updateSession(sessionId, userId, {
      open_views_state: state,
    });

    return NextResponse.json({
      success: true,
      message: 'Views state updated',
    });
  } catch (error) {
    console.error('Error updating views state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update views state' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session/[id]/views-state
 * Get the open views state for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const { id: sessionId } = params;
    const session = await db.getSession(sessionId, userId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    let viewsState = { openViewIds: [], activeViewId: null };

    if (session.open_views_state) {
      try {
        viewsState = JSON.parse(session.open_views_state);
      } catch (error) {
        console.error('Error parsing views state:', error);
      }
    }

    return NextResponse.json({
      success: true,
      viewsState,
    });
  } catch (error) {
    console.error('Error getting views state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get views state' },
      { status: 500 }
    );
  }
}

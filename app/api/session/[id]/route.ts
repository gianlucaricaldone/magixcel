/**
 * Session API Routes (Refactored)
 *
 * GET    /api/session/[id] - Get session metadata
 * PUT    /api/session/[id] - Update session
 * DELETE /api/session/[id] - Delete session (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    const session = await db.getSession(sessionId, userId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Update last accessed time
    await db.updateLastAccessed(sessionId);

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('[Session GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message || 'Failed to retrieve session',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    const body = await request.json();
    const { name, active_filters } = body;

    // Check if session exists
    const existingSession = await db.getSession(sessionId, userId);
    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Update session
    const updatedSession = await db.updateSession(sessionId, userId, {
      name,
      active_filters,
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
    });
  } catch (error: any) {
    console.error('[Session PUT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message || 'Failed to update session',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    // Check if session exists
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete session in database
    await db.deleteSession(sessionId, userId);

    // Optional: Delete files from storage (can be done async or via cleanup job)
    // For now, we keep files for potential recovery
    // In production, you might want to schedule cleanup of deleted sessions

    console.log(`[Session DELETE] Session ${sessionId} soft deleted`);

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error: any) {
    console.error('[Session DELETE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message || 'Failed to delete session',
        },
      },
      { status: 500 }
    );
  }
}

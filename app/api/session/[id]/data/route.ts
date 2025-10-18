import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Validate session
    const session = await db.getSession(sessionId);
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

    // Load data
    const dataBuffer = await storage.get(`${sessionId}/data.json`);
    const data = JSON.parse(dataBuffer.toString('utf8'));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Session data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to load session data',
        },
      },
      { status: 500 }
    );
  }
}

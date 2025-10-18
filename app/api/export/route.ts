import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { ERROR_CODES } from '@/lib/utils/constants';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, filterHash, format = 'csv', options = {} } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session ID is required',
          },
        },
        { status: 400 }
      );
    }

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

    let data;

    // If filterHash provided, get cached filtered data
    if (filterHash) {
      const cached = await db.getCachedResult(sessionId, filterHash);
      if (cached) {
        const cachedData = JSON.parse(cached.result_data);
        data = cachedData.data;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.PROCESSING_ERROR,
              message: 'Filtered data not found',
            },
          },
          { status: 404 }
        );
      }
    } else {
      // Get full data
      const dataBuffer = await storage.get(`${sessionId}/data.json`);
      data = JSON.parse(dataBuffer.toString('utf8'));
    }

    // Export based on format
    if (format === 'csv') {
      const csv = Papa.unparse(data, {
        header: options.includeHeaders !== false,
        delimiter: options.delimiter || ',',
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.EXPORT_FAILED,
            message: `Unsupported export format: ${format}`,
          },
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.EXPORT_FAILED,
          message: error.message || 'Failed to export data',
        },
      },
      { status: 500 }
    );
  }
}

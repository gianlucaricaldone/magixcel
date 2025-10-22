import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { ERROR_CODES } from '@/lib/utils/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;

    // Get session metadata
    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Only Excel files have multiple sheets
    if (session.file_type !== 'xlsx' && session.file_type !== 'xls') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'This session is not an Excel file',
          },
        },
        { status: 400 }
      );
    }

    // Read sheets.json
    const sheetsPath = path.join(process.cwd(), 'data', 'uploads', sessionId, 'sheets.json');

    try {
      const sheetsData = await fs.readFile(sheetsPath, 'utf-8');
      const sheets = JSON.parse(sheetsData);

      // Extract sheet metadata (without full data)
      const sheetMetadata = sheets.map((sheet: any) => ({
        name: sheet.sheetName,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        columns: sheet.columns,
      }));

      return NextResponse.json({
        success: true,
        sheets: sheetMetadata,
      });
    } catch (fileError) {
      console.error('Error reading sheets.json:', fileError);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'sheets.json not found for this session',
          },
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/session/[id]/sheets:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error instanceof Error ? error.message : 'Failed to get sheets',
        },
      },
      { status: 500 }
    );
  }
}

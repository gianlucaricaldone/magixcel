/**
 * Session Sheets API Route (Refactored)
 *
 * Returns complete sheet data (metadata + data) for Excel files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { createDuckDBClient } from '@/lib/duckdb/client';
import { LocalStorageAdapter } from '@/lib/adapters/storage/local';
import { ERROR_CODES } from '@/lib/utils/constants';
import { ISheetData } from '@/lib/processing/excel-processor';

/**
 * Convert BigInt and DuckDB special types to JSON-serializable values
 */
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);

  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle DuckDB special types (Decimal, Timestamp, etc.)
    // These have a valueOf() or toString() method
    if (typeof obj.valueOf === 'function') {
      const value = obj.valueOf();
      // If valueOf returns a primitive, use it
      if (typeof value !== 'object') {
        return value;
      }
    }

    // Try toString() for special objects
    if (typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
      const strValue = obj.toString();
      // If toString returns something useful (not "[object Object]"), use it
      if (strValue !== '[object Object]') {
        return strValue;
      }
    }

    // Regular object: iterate keys
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }

  return obj;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const duckdb = createDuckDBClient();

  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const userId = getCurrentUserId();
    const sessionId = params.id;

    console.log(`[Sheets API] Loading sheets for session: ${sessionId}`);

    // Get session metadata
    const session = await db.getSession(sessionId, userId);
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

    // Get sheets metadata from session.metadata
    const sheetsMetadata = session.metadata?.sheets || [];

    if (sheetsMetadata.length === 0) {
      return NextResponse.json({
        success: true,
        sheets: [],
      });
    }

    // Get Parquet path
    let parquetPath: string;
    if (storage instanceof LocalStorageAdapter) {
      parquetPath = storage.getAbsolutePath(session.r2_path_parquet);
    } else {
      parquetPath = await storage.getPublicUrl(session.r2_path_parquet);
    }

    console.log(`[Sheets API] Querying Parquet: ${parquetPath}`);

    // Connect to DuckDB
    await duckdb.connect();

    // Query data for each sheet
    const sheetsWithData: ISheetData[] = [];

    for (const sheetMeta of sheetsMetadata) {
      const sheetName = sheetMeta.name;

      // Query data for this sheet (limit to prevent large responses)
      // Note: Parquet converter adds a 'sheet' column for multi-sheet Excel files
      const MAX_ROWS = 10000;

      // Get column names (excluding 'sheet' column)
      const columnNames = sheetMeta.columns?.map((col: any) => col.name) || [];
      const selectColumns = columnNames.length > 0
        ? columnNames.map(col => `"${col}"`).join(', ')
        : '*';

      const query = `
        SELECT ${selectColumns}
        FROM read_parquet('${parquetPath}')
        WHERE sheet = '${sheetName.replace(/'/g, "''")}'
        LIMIT ${MAX_ROWS}
      `;

      const result = await duckdb.query(query);

      // Convert BigInt to Number
      const convertedData = convertBigIntToNumber(result.rows);

      sheetsWithData.push({
        sheetName,
        data: convertedData,
        columns: columnNames,
        rowCount: sheetMeta.rowCount || result.rowCount,
        columnCount: sheetMeta.columnCount || result.columns.length,
        columnTypes: sheetMeta.columns || [],
      });

      console.log(`[Sheets API] Loaded sheet "${sheetName}": ${result.rowCount} rows`);
    }

    await duckdb.close();

    console.log(`[Sheets API] Total sheets loaded: ${sheetsWithData.length}`);

    // Return complete sheet data
    return NextResponse.json({
      success: true,
      sheets: sheetsWithData,
    });

  } catch (error: any) {
    console.error('[Sheets API] Error:', error);

    // Ensure DuckDB connection is closed
    try {
      await duckdb.close();
    } catch (closeError) {
      console.error('[Sheets API] Close error:', closeError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to load sheets',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

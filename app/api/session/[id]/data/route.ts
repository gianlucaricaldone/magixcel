/**
 * Session Data API Route (Refactored)
 *
 * Returns all data for a session by querying the Parquet file with DuckDB
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { createDuckDBClient } from '@/lib/duckdb/client';
import { LocalStorageAdapter } from '@/lib/adapters/storage/local';
import { ERROR_CODES } from '@/lib/utils/constants';

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

    console.log(`[Session Data] Loading data for session: ${sessionId}`);

    // Get session from database
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

    // Check if Parquet path exists
    if (!session.r2_path_parquet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.PROCESSING_ERROR,
            message: 'Parquet file not available for this session',
          },
        },
        { status: 500 }
      );
    }

    // Get absolute path to Parquet file (local) or URL (R2)
    let parquetPath: string;
    if (storage instanceof LocalStorageAdapter) {
      parquetPath = storage.getAbsolutePath(session.r2_path_parquet);
    } else {
      // For R2, get signed URL
      parquetPath = await storage.getPublicUrl(session.r2_path_parquet);
    }

    console.log(`[Session Data] Querying Parquet: ${parquetPath}`);

    // Connect to DuckDB
    await duckdb.connect();

    // Query all data from Parquet (with reasonable limit for initial load)
    // Note: For multi-sheet Excel, Parquet has 'sheet' column - we exclude it
    const MAX_ROWS = 10000; // Limit to 10k rows for /data endpoint

    // Get columns from metadata (excluding 'sheet' column)
    let selectColumns = '*';
    if (session.metadata?.sheets && session.metadata.sheets.length > 0) {
      const columns = session.metadata.sheets[0]?.columns;
      if (columns && columns.length > 0) {
        selectColumns = columns.map((col: any) => `"${col.name}"`).join(', ');
      }
    }

    const query = `SELECT ${selectColumns} FROM read_parquet('${parquetPath}') LIMIT ${MAX_ROWS}`;

    const result = await duckdb.query(query);

    // Get row count
    const countQuery = `SELECT COUNT(*) as total FROM read_parquet('${parquetPath}')`;
    const countResult = await duckdb.query(countQuery);
    // Convert BigInt to Number
    const totalRows = countResult.rows[0]?.total ? Number(countResult.rows[0].total) : 0;

    await duckdb.close();

    console.log(`[Session Data] Query complete: ${result.rowCount} rows (${result.executionTime}ms)`);

    // Debug: Log first row before conversion
    if (result.rows.length > 0) {
      console.log('[Session Data] First row BEFORE conversion:', {
        Price: result.rows[0]['Price'],
        Date: result.rows[0]['Date'],
        'Price type': typeof result.rows[0]['Price'],
        'Date type': typeof result.rows[0]['Date'],
      });
    }

    // Convert BigInt values to Number before returning
    const convertedData = convertBigIntToNumber(result.rows);

    // Debug: Log first row after conversion
    if (convertedData.length > 0) {
      console.log('[Session Data] First row AFTER conversion:', {
        Price: convertedData[0]['Price'],
        Date: convertedData[0]['Date'],
      });
    }

    // Prepare sheets metadata from session
    const sheets = session.metadata?.sheets || null;

    // Return data in expected format
    return NextResponse.json({
      success: true,
      data: convertedData,
      sheets,
      metadata: {
        rowCount: result.rowCount,
        totalRows,
        columns: result.columns,
        executionTime: result.executionTime,
        limited: totalRows > MAX_ROWS,
      },
    });

  } catch (error: any) {
    console.error('[Session Data] Error:', error);

    // Ensure DuckDB connection is closed
    try {
      await duckdb.close();
    } catch (closeError) {
      console.error('[Session Data] Close error:', closeError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to load session data',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

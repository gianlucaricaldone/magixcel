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
    const MAX_ROWS = 10000; // Limit to 10k rows for /data endpoint
    const query = `SELECT * FROM read_parquet('${parquetPath}') LIMIT ${MAX_ROWS}`;

    const result = await duckdb.query(query);

    // Get row count
    const countQuery = `SELECT COUNT(*) as total FROM read_parquet('${parquetPath}')`;
    const countResult = await duckdb.query(countQuery);
    const totalRows = countResult.rows[0]?.total || 0;

    await duckdb.close();

    console.log(`[Session Data] Query complete: ${result.rowCount} rows (${result.executionTime}ms)`);

    // Prepare sheets metadata from session
    const sheets = session.metadata?.sheets || null;

    // Return data in expected format
    return NextResponse.json({
      success: true,
      data: result.rows,
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
